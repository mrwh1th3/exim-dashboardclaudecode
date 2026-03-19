import { createClient } from '@/lib/supabase/server'
import { CalendarLogEntry } from '@/types/social'

function mapRow(row: any): CalendarLogEntry {
  return {
    id: row.id,
    postId: row.post_id,
    changedBy: row.changed_by,
    changedByName: (row.profiles as { full_name: string } | null)?.full_name ?? undefined,
    oldScheduledDate: row.old_scheduled_date ?? undefined,
    oldScheduledTime: row.old_scheduled_time ?? undefined,
    newScheduledDate: row.new_scheduled_date ?? undefined,
    newScheduledTime: row.new_scheduled_time ?? undefined,
    changedAt: row.changed_at,
  }
}

export async function getCalendarLog(postId: string): Promise<CalendarLogEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calendar_log')
    .select('*, profiles!calendar_log_changed_by_fkey(full_name)')
    .eq('post_id', postId)
    .order('changed_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function logCalendarEdit(entry: {
  postId: string
  changedBy: string
  oldScheduledDate?: string
  oldScheduledTime?: string
  newScheduledDate?: string
  newScheduledTime?: string
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('calendar_log').insert({
    post_id: entry.postId,
    changed_by: entry.changedBy,
    old_scheduled_date: entry.oldScheduledDate ?? null,
    old_scheduled_time: entry.oldScheduledTime ?? null,
    new_scheduled_date: entry.newScheduledDate ?? null,
    new_scheduled_time: entry.newScheduledTime ?? null,
    changed_at: new Date().toISOString(),
  })
}
