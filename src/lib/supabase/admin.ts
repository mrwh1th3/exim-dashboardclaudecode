import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only instantiated when first used (not at build time)
let _adminClient: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izjnvkwgzmrfpaxjmwjb.supabase.co'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.service_role
    if (!url || !key) {
      throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL o service_role (SUPABASE_SERVICE_ROLE_KEY)')
    }
    _adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _adminClient
}

// Proxy for convenient dot-access — defers instantiation until first property access
export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getAdminClient()[prop as keyof SupabaseClient]
  },
})
