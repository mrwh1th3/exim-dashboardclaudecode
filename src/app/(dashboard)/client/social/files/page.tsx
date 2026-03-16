'use client'

import { FileManager } from '@/components/shared/file-manager'
import { useAuthStore } from '@/stores/auth-store'

export default function ClientSocialFilesPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archivos - Redes Sociales</h1>
        <p className="text-muted-foreground">
          Tus archivos de referencia para redes sociales
        </p>
      </div>
      <FileManager section="social" isAdmin={false} clientId={user?.id} />
    </div>
  )
}
