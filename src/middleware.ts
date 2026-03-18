import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izjnvkwgzmrfpaxjmwjb.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6am52a3dnem1yZnBheGptd2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTA5NDcsImV4cCI6MjA4NzYyNjk0N30.lvlD7qjMUnSbmEoDhFXnyDUZ1BTLcHPJkZrknTDbg0I'

export async function middleware(request: NextRequest) {
  // Standard @supabase/ssr middleware pattern — refreshes session cookies
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: use getUser() not getSession() — getUser() validates the JWT with Supabase servers
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect /admin and /client — redirect to login if not authenticated
  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/client'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from /login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except static files, API routes, and PWA assets
    '/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|icons).*)',
  ],
}
