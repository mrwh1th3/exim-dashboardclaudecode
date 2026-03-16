'use client'

import { HorizontalHeader } from '@/components/layout/horizontal-header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <HorizontalHeader />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
        {children}
      </main>
    </div>
  )
}
