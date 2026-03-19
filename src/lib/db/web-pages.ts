import { createClient } from '@/lib/supabase/server'
import { WebPage, WebPageChange } from '@/types/web-pages'

export async function getWebPages(clientId?: string): Promise<WebPage[]> {
  const supabase = await createClient()
  let query = supabase
    .from('web_pages')
    .select('*, profiles!web_pages_client_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    url: row.url ?? undefined,
    domain: row.domain ?? undefined,
    status: row.status,
    lastDeployedAt: row.last_deployed_at ?? undefined,
    sslExpiry: row.ssl_expiry ?? undefined,
    planId: row.plan_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getWebPageChanges(webPageId: string): Promise<WebPageChange[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('web_page_changes')
    .select('*')
    .eq('web_page_id', webPageId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    webPageId: row.web_page_id,
    title: row.title,
    description: row.description,
    status: row.status,
    requestId: row.request_id ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  }))
}

export async function updateWebPage(id: string, data: Partial<WebPage>): Promise<void> {
  const supabase = await createClient()
  await supabase.from('web_pages').update({
    url: data.url,
    domain: data.domain,
    status: data.status,
    last_deployed_at: data.lastDeployedAt,
    ssl_expiry: data.sslExpiry,
  }).eq('id', id)
}

export async function createWebPageChange(webPageId: string, title: string, description: string, requestId?: string): Promise<WebPageChange> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('web_page_changes')
    .insert({
      web_page_id: webPageId,
      title,
      description,
      status: 'pending',
      request_id: requestId,
    })
    .select()
    .single()
  
  if (error) throw error
  
  return {
    id: data.id,
    webPageId: data.web_page_id,
    title: data.title,
    description: data.description || '',
    status: data.status,
    requestId: data.request_id ?? undefined,
    createdAt: data.created_at,
    completedAt: data.completed_at ?? undefined,
  }
}
