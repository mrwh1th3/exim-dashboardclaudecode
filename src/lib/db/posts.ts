import { createClient } from '@/lib/supabase/server'
import { SocialPost, SocialStrategy, PostStatus, PostType, Platform, StrategyStatus } from '@/types/social'

function mapPost(row: any): SocialPost {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    type: (row.type as PostType) ?? 'post',
    title: row.title ?? undefined,
    content: row.content,
    mediaUrls: row.media_urls ?? [],
    platforms: row.platforms ?? [],
    scheduledDate: row.scheduled_date ?? undefined,
    scheduledTime: row.scheduled_time ?? undefined,
    status: row.status as PostStatus,
    changeRounds: row.change_rounds ?? 0,
    maxRounds: row.max_rounds ?? 3,
    canvaDesignId: row.canva_design_id ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    notes: row.notes ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPosts(filters?: {
  clientId?: string
  status?: PostStatus
  platform?: Platform
  type?: PostType
}): Promise<SocialPost[]> {
  const supabase = await createClient()
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_client_id_fkey(full_name)')
    .order('created_at', { ascending: false })
  if (filters?.clientId) query = query.eq('client_id', filters.clientId)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.platform) query = query.contains('platforms', [filters.platform])
  if (filters?.type) query = query.eq('type', filters.type)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapPost)
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
  approvedBy?: string
): Promise<void> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {
    status,
    approved_by: approvedBy ?? null,
    updated_at: new Date().toISOString(),
  }
  // Auto-schedule when approved
  if (status === 'approved') {
    updates.status = 'scheduled'
  }
  await supabase.from('posts').update(updates).eq('id', id)
}

export async function requestPostChanges(
  id: string,
  clientId: string,
  message: string
): Promise<{ blocked: boolean; roundsUsed: number; maxRounds: number }> {
  const supabase = await createClient()

  // Fetch current round count and max
  const { data: post, error } = await supabase
    .from('posts')
    .select('change_rounds, max_rounds, type')
    .eq('id', id)
    .single()
  if (error || !post) throw error ?? new Error('Post not found')

  const newRounds = (post.change_rounds ?? 0) + 1
  const max = post.max_rounds ?? (post.type === 'story' ? 1 : 3)

  if (newRounds > max) {
    return { blocked: true, roundsUsed: post.change_rounds, maxRounds: max }
  }

  const reachedMax = newRounds >= max
  await supabase
    .from('posts')
    .update({
      status: reachedMax ? 'max_rounds_reached' : 'changes_requested',
      change_rounds: newRounds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Insert feedback entry
  await supabase.from('post_feedback').insert({
    post_id: id,
    client_id: clientId,
    author_role: 'client',
    message,
    round_number: newRounds,
    status: 'open',
  })

  return { blocked: false, roundsUsed: newRounds, maxRounds: max }
}

export async function escalatePost(id: string, clientId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('posts')
    .update({ notes: 'ESCALADO A ADMIN', updated_at: new Date().toISOString() })
    .eq('id', id)
  await supabase.from('post_feedback').insert({
    post_id: id,
    client_id: clientId,
    author_role: 'client',
    message: 'ESCALADO: El cliente solicitó intervención del Agency Admin.',
    round_number: 0,
    status: 'open',
  })
}

export async function createPost(
  data: Partial<SocialPost> & { createdBy: string }
): Promise<void> {
  const supabase = await createClient()
  const isStory = data.type === 'story'
  await supabase.from('posts').insert({
    client_id: data.clientId,
    type: data.type ?? 'post',
    title: data.title,
    content: data.content ?? '',
    media_urls: data.mediaUrls ?? [],
    platforms: data.platforms ?? [],
    scheduled_date: data.scheduledDate,
    scheduled_time: data.scheduledTime,
    status: data.status ?? 'draft',
    change_rounds: 0,
    max_rounds: isStory ? 1 : 3,
    canva_design_id: data.canvaDesignId ?? null,
    notes: data.notes,
    created_by: data.createdBy,
  })
}

export async function updatePostSchedule(
  id: string,
  scheduledDate: string,
  scheduledTime: string,
  changedBy: string
): Promise<{ oldDate?: string; oldTime?: string }> {
  const supabase = await createClient()

  // Get current schedule before updating
  const { data: current } = await supabase
    .from('posts')
    .select('scheduled_date, scheduled_time, status')
    .eq('id', id)
    .single()

  await supabase
    .from('posts')
    .update({
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Log the change
  await supabase.from('calendar_log').insert({
    post_id: id,
    changed_by: changedBy,
    old_scheduled_date: current?.scheduled_date ?? null,
    old_scheduled_time: current?.scheduled_time ?? null,
    new_scheduled_date: scheduledDate,
    new_scheduled_time: scheduledTime,
    changed_at: new Date().toISOString(),
  })

  return {
    oldDate: current?.scheduled_date ?? undefined,
    oldTime: current?.scheduled_time ?? undefined,
  }
}

// ─── Strategies ────────────────────────────────────────────────────────────────

function mapStrategy(row: any): SocialStrategy {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
    title: row.title,
    content: row.content ?? '',
    status: (row.status as StrategyStatus) ?? 'draft',
    bimesterStart: row.bimester_start ?? undefined,
    bimesterEnd: row.bimester_end ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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
  return (data ?? []).map(mapStrategy)
}

export async function updateStrategyStatus(
  id: string,
  status: StrategyStatus
): Promise<void> {
  const supabase = await createClient()
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  }
  await supabase.from('social_strategies').update(updates).eq('id', id)
}
