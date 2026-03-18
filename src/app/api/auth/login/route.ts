import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izjnvkwgzmrfpaxjmwjb.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6am52a3dnem1yZnBheGptd2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTA5NDcsImV4cCI6MjA4NzYyNjk0N30.lvlD7qjMUnSbmEoDhFXnyDUZ1BTLcHPJkZrknTDbg0I'
// Only treat as valid if it looks like a real JWT (prevents placeholder values)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('ey')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : undefined

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const cookieStore = await cookies()

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Attempt normal login first
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  // If login succeeds, get profile by user ID (required for RLS)
  if (data?.user && !error) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  }

  // Login failed - check if user exists in profiles table but not in Auth
  if (error?.message?.includes('Invalid login credentials') && SUPABASE_SERVICE_KEY) {
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if user exists in profiles by email
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (existingProfile) {
      // User exists in profiles but not in Auth - create Auth user
      const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: existingProfile.full_name },
      })

      if (createError) {
        // If user already exists in auth, it might be wrong password
        if (createError.message?.includes('already been registered')) {
          return NextResponse.json(
            { error: 'Contraseña incorrecta' },
            { status: 401 }
          )
        }
        console.error('Error creating auth user:', createError)
        return NextResponse.json(
          { error: `Error al crear usuario: ${createError.message}` },
          { status: 500 }
        )
      }

      if (newAuthUser?.user) {
        // Now login with the newly created user
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (retryError || !retryData?.user) {
          return NextResponse.json(
            { error: 'Usuario creado. Intenta iniciar sesión de nuevo.' },
            { status: 401 }
          )
        }

        // Return the existing profile (by email)
        return NextResponse.json({ profile: existingProfile })
      }
    } else {
      // User doesn't exist in profiles either
      return NextResponse.json(
        { error: 'Usuario no encontrado. Contacta al administrador.' },
        { status: 404 }
      )
    }
  }

  // Default error response
  return NextResponse.json(
    { error: error?.message ?? 'Credenciales incorrectas' },
    { status: 401 }
  )
}
