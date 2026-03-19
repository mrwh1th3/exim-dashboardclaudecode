'use client'

import { FileManager } from '@/components/shared/file-manager'
import { useAuthStore } from '@/stores/auth-store'
import { ServiceNotAvailable } from '@/components/shared/service-not-available'
import { useClientServices } from '@/hooks/use-client-services'

export default function ClientSocialFilesPage() {
  const user = useAuthStore((s) => s.user)
  const { hasSocialMedia, loading: servicesLoading } = useClientServices()

  // Show service not available if client doesn't have social media service
  if (!servicesLoading && !hasSocialMedia) {
    return <ServiceNotAvailable serviceName="Redes Sociales" />
  }

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
