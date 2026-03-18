'use client'

import { FileManager } from '@/components/shared/file-manager'

export default function AdminWebFilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Archivos - Página Web</h1>
        <p className="text-muted-foreground">
          Gestiona archivos de referencia para páginas web
        </p>
      </div>
      <FileManager section="web" isAdmin={true} />
    </div>
  )
}
