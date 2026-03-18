'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { HorizontalHeader } from '@/components/layout/horizontal-header'
import { useAuthStore } from '@/stores/auth-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const loadUser = useAuthStore((s) => s.loadUser)

  useEffect(() => {
    loadUser()
  }, [loadUser])

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
