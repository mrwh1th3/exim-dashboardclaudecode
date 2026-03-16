import { createClient } from '@/lib/supabase/server'
import {
  FlowTemplate,
  FlowStage,
  FormTemplate,
  ClientFlow,
  ClientStageProgress,
  FormSubmission,
} from '@/types/onboarding'

export async function getFlowTemplates(): Promise<FlowTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('flow_templates')
    .select('*, flow_stages(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    type: row.type,
    isActive: row.is_active,
    stages: (row.flow_stages ?? []).map((s: Record<string, unknown>) => ({
      id: s.id,
      flowTemplateId: s.flow_template_id,
      name: s.name,
      description: s.description ?? '',
      orderIndex: s.order_index,
      popupContent: s.popup_content ?? undefined,
      dependsOnStageId: s.depends_on_stage_id ?? undefined,
      formIds: s.form_ids ?? [],
    })),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getFormTemplates(): Promise<FormTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    schema: row.schema,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getClientFlows(clientId?: string): Promise<ClientFlow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('client_flows')
    .select('*, profiles!client_flows_client_id_fkey(full_name), flow_templates(name, type)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    flowTemplateId: row.flow_template_id,
    flowTemplateName: (row.flow_templates as { name: string } | null)?.name ?? '',
    status: row.status,
    assignedBy: row.assigned_by,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
  }))
}

export async function getClientStageProgress(clientFlowId: string): Promise<ClientStageProgress[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_stage_progress')
    .select('*')
    .eq('client_flow_id', clientFlowId)
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientFlowId: row.client_flow_id,
    stageId: row.stage_id,
    status: row.status,
    completedAt: row.completed_at ?? undefined,
  }))
}

export async function updateStageProgress(
  id: string,
  status: ClientStageProgress['status']
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('client_stage_progress').update({
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  }).eq('id', id)
}

export async function submitForm(data: {
  clientFlowId: string
  formTemplateId: string
  stageId: string
  clientId: string
  formData: Record<string, unknown>
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('form_submissions').insert({
    client_flow_id: data.clientFlowId,
    form_template_id: data.formTemplateId,
    stage_id: data.stageId,
    client_id: data.clientId,
    data: data.formData,
  })
}
