'use client'

import { create } from 'zustand'
import { Profile, UserRole } from '@/types/auth'
import { createClient } from '@/lib/supabase/client'

interface AuthStore {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setRole: (role: UserRole) => void
  updateProfile: (updates: Partial<Profile>) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  switchToClient: (clientId: string) => void
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

  setRole: (role) => set((state) => ({
    user: state.user ? { ...state.user, role } : null,
  })),

  login: async (email: string, password: string) => {
    const supabase = createClient()
    set({ isLoading: true })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      set({ isLoading: false })
      return { success: false, error: error?.message ?? 'Error al iniciar sesión' }
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
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

    return { success: true }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Clear impersonation
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('exim-impersonate')
    }
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

  switchToClient: (clientId: string) => {
    // Admin impersonation: store target clientId in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('exim-impersonate', clientId)
    }
    // The actual client data will be fetched by the page using the stored clientId
  },
}))
