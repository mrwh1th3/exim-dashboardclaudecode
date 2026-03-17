import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izjnvkwgzmrfpaxjmwjb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6am52a3dnem1yZnBheGptd2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTA5NDcsImV4cCI6MjA4NzYyNjk0N30.lvlD7qjMUnSbmEoDhFXnyDUZ1BTLcHPJkZrknTDbg0I',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can't be set here,
            // but the middleware handles session refresh so this is safe to ignore.
          }
        },
      },
    }
  )
}
