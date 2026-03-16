import { createClient } from '@/lib/supabase/server'
import { Request, RequestStatus } from '@/types/requests'

export async function getRequestStatuses(): Promise<RequestStatus[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('request_statuses')
    .select('*')
    .order('order_index', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    orderIndex: row.order_index,
    isDefault: row.is_default,
    createdAt: row.created_at,
  }))
}

export async function getRequests(filters?: {
  clientId?: string
  type?: string
  statusId?: string
}): Promise<Request[]> {
  const supabase = await createClient()
  let query = supabase
    .from('requests')
    .select('*, profiles!requests_client_id_fkey(full_name), request_statuses(name, color)')
    .order('created_at', { ascending: false })
  if (filters?.clientId) query = query.eq('client_id', filters.clientId)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.statusId) query = query.eq('status_id', filters.statusId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    type: row.type,
    statusId: row.status_id,
    status: row.request_statuses as RequestStatus,
    urgency: row.urgency ?? 'normal',
    pageSection: row.page_section ?? undefined,
    changeDescription: row.change_description ?? undefined,
    productTitle: row.product_title ?? undefined,
    productPrice: row.product_price ?? undefined,
    productCategory: row.product_category ?? undefined,
    productDescription: row.product_description ?? undefined,
    implementationDescription: row.implementation_description ?? undefined,
    adminNotes: row.admin_notes ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    attachments: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function createRequest(data: Partial<Request>): Promise<string> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('requests')
    .insert({
      client_id: data.clientId,
      type: data.type,
      status_id: data.statusId,
      urgency: data.urgency ?? 'normal',
      page_section: data.pageSection,
      change_description: data.changeDescription,
      product_title: data.productTitle,
      product_price: data.productPrice,
      product_category: data.productCategory,
      product_description: data.productDescription,
      implementation_description: data.implementationDescription,
    })
    .select('id')
    .single()
  if (error) throw error
  return result.id
}

export async function updateRequest(id: string, data: Partial<Request>): Promise<void> {
  const supabase = await createClient()
  await supabase.from('requests').update({
    status_id: data.statusId,
    admin_notes: data.adminNotes,
    assigned_to: data.assignedTo,
    urgency: data.urgency,
  }).eq('id', id)
}
