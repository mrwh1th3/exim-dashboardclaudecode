import { createClient } from '@/lib/supabase/server'
import { Profile, UserRole } from '@/types/auth'

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string,
    avatarUrl: row.avatar_url as string | undefined,
    role: row.role as UserRole,
    companyName: row.company_name as string | undefined,
    phone: row.phone as string | undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getProfiles(filter?: { role?: UserRole }): Promise<Profile[]> {
  const supabase = await createClient()
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (filter?.role) query = query.eq('role', filter.role)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapProfile)
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) return null
  return mapProfile(data)
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  const supabase = await createClient()
  await supabase.from('profiles').update({
    full_name: updates.fullName,
    avatar_url: updates.avatarUrl,
    company_name: updates.companyName,
    phone: updates.phone,
    is_active: updates.isActive,
  }).eq('id', id)
}
