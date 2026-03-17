import { createBrowserClient } from '@supabase/ssr'

// Use safe fallbacks during build/SSR so Next.js static generation doesn't crash.
// Real values are always present at runtime (browser) when env vars are configured.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izjnvkwgzmrfpaxjmwjb.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6am52a3dnem1yZnBheGptd2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTA5NDcsImV4cCI6MjA4NzYyNjk0N30.lvlD7qjMUnSbmEoDhFXnyDUZ1BTLcHPJkZrknTDbg0I'

let _client: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  // Singleton to avoid creating a new client on every render
  if (!_client) {
    _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _client
}
