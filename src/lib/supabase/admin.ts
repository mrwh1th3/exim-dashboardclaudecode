import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only instantiated when first used (not at build time)
let _adminClient: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.service_role
    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
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
