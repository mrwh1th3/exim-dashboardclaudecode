'use client'

import { FileManager } from '@/components/shared/file-manager'

export default function AdminSocialFilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archivos - Redes Sociales</h1>
        <p className="text-muted-foreground">
          Gestiona archivos de referencia para redes sociales
        </p>
      </div>
      <FileManager section="social" isAdmin={true} />
    </div>
  )
}
