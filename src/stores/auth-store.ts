import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Profile, UserRole } from '@/types/auth'
import { mockAdmins, mockClients } from '@/data/mock-clients'

interface AuthStore {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setRole: (role: UserRole) => void
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchToClient: (clientId: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: mockAdmins[0], // Default to admin for development
      isLoading: false,

      setUser: (user) => set({ user }),

      setRole: (role) => {
        if (role === 'admin') {
          set({ user: mockAdmins[0] })
        } else if (role === 'editor') {
          set({ user: mockAdmins[1] })
        } else {
          set({ user: mockClients[0] })
        }
      },

      login: async (email: string, _password: string) => {
        set({ isLoading: true })
        // Mock login - find user by email
        const allUsers = [...mockAdmins, ...mockClients]
        const user = allUsers.find((u) => u.email === email)
        if (user) {
          set({ user, isLoading: false })
          return true
        }
        set({ isLoading: false })
        return false
      },

      logout: () => set({ user: null }),

      switchToClient: (clientId: string) => {
        const client = mockClients.find((c) => c.id === clientId)
        if (client) set({ user: client })
      },
    }),
    { name: 'exim-auth' }
  )
)
