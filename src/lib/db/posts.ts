import { createClient } from '@/lib/supabase/server'
import { SocialPost, SocialStrategy, PostStatus, Platform } from '@/types/social'

export async function getPosts(filters?: {
  clientId?: string
  status?: PostStatus
  platform?: Platform
}): Promise<SocialPost[]> {
  const supabase = await createClient()
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_client_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (filters?.clientId) query = query.eq('client_id', filters.clientId)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.platform) query = query.contains('platforms', [filters.platform])
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    title: row.title ?? undefined,
    content: row.content,
    mediaUrls: row.media_urls ?? [],
    platforms: row.platforms ?? [],
    scheduledDate: row.scheduled_date ?? undefined,
    scheduledTime: row.scheduled_time ?? undefined,
    status: row.status,
    approvedBy: row.approved_by ?? undefined,
    notes: row.notes ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function updatePostStatus(id: string, status: PostStatus, approvedBy?: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('posts').update({ status, approved_by: approvedBy ?? null }).eq('id', id)
}

export async function createPost(data: Partial<SocialPost> & { createdBy: string }): Promise<void> {
  const supabase = await createClient()
  await supabase.from('posts').insert({
    client_id: data.clientId,
    title: data.title,
    content: data.content ?? '',
    media_urls: data.mediaUrls ?? [],
    platforms: data.platforms ?? [],
    scheduled_date: data.scheduledDate,
    scheduled_time: data.scheduledTime,
    status: data.status ?? 'draft',
    notes: data.notes,
    created_by: data.createdBy,
  })
}

export async function getStrategies(clientId?: string): Promise<SocialStrategy[]> {
  const supabase = await createClient()
  let query = supabase
    .from('social_strategies')
    .select('*, profiles!social_strategies_client_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    title: row.title,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}
