'use client'

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
      <main className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ background: 'oklch(0.14 0 0)' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(oklch(1 0 0 / 3%) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            position: 'fixed',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
