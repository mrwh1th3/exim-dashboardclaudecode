import { createClient } from '@/lib/supabase/server'
import { PostFeedback } from '@/types/social'

function mapRow(row: any): PostFeedback {
  return {
    id: row.id,
    postId: row.post_id,
    clientId: row.client_id,
    authorRole: row.author_role,
    message: row.message,
    roundNumber: row.round_number,
    status: row.status as 'open' | 'resolved',
    createdAt: row.created_at,
  }
}

export async function getPostFeedback(postId: string): Promise<PostFeedback[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_feedback')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function addPostFeedback(entry: {
  postId: string
  clientId: string
  authorRole: string
  message: string
  roundNumber: number
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('post_feedback').insert({
    post_id: entry.postId,
    client_id: entry.clientId,
    author_role: entry.authorRole,
    message: entry.message,
    round_number: entry.roundNumber,
    status: 'open',
  })
}
