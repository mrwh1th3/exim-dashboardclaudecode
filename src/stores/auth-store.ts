'use client'

import { create } from 'zustand'
import { Profile } from '@/types/auth'
import { createClient } from '@/lib/supabase/client'

interface AuthStore {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  updateProfile: (updates: Partial<Profile>) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: false,

  setUser: (user) => set({ user }),

  updateProfile: async (updates) => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        avatar_url: updates.avatarUrl,
        company_name: updates.companyName,
        phone: updates.phone,
      })
      .eq('id', authUser.id)

    set((state) => ({
      user: state.user ? { ...state.user, ...updates, updatedAt: new Date().toISOString() } : null,
    }))
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        set({ isLoading: false })
        return { success: false, error: data.error ?? 'Credenciales incorrectas' }
      }

      const profile = data.profile
      set({
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          companyName: profile.company_name,
          phone: profile.phone,
          isActive: profile.is_active,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        isLoading: false,
      })

      return { success: true }
    } catch {
      set({ isLoading: false })
      return { success: false, error: 'No se pudo conectar al servidor. Verifica tu conexión.' }
    }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null })
  },

  loadUser: async () => {
    const supabase = createClient()
    set({ isLoading: true })

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      set({ user: null, isLoading: false })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      set({
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          companyName: profile.company_name,
          phone: profile.phone,
          isActive: profile.is_active,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
        isLoading: false,
      })
    } else {
      set({ isLoading: false })
    }
  },
}))
