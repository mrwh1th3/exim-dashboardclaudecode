export type UserRole = 'admin' | 'editor' | 'client'

export interface Profile {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: UserRole
  companyName?: string
  phone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setRole: (role: UserRole) => void
}
