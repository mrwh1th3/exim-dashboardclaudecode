'use client'

import { FileManager } from '@/components/shared/file-manager'
import { useAuthStore } from '@/stores/auth-store'

export default function ClientWebFilesPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archivos - P\u00e1gina Web</h1>
        <p className="text-muted-foreground">
          Tus archivos de referencia para tu p\u00e1gina web
        </p>
      </div>
      <FileManager section="web" isAdmin={false} clientId={user?.id} />
    </div>
  )
}
