'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import nextDynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

const HorizontalHeader = nextDynamic(
  () => import('@/components/layout/horizontal-header').then((m) => m.HorizontalHeader),
  { ssr: false }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loadUser, user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Client-side fallback guard: if session expired mid-visit, redirect to login
  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace('/login')
    }
  }, [isLoading, user, router])

  return (
    <div className="flex min-h-screen flex-col">
      <HorizontalHeader />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background">
        <div
          className="absolute inset-0 pointer-events-none bg-dot-grid"
          style={{ position: 'fixed' }}
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
