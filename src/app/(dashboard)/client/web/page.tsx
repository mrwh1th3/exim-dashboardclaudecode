'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { WebPageStatus } from '@/types/web-pages'
import { mockWebPages, mockWebPageChanges } from '@/data/mock-web-pages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Globe,
  Shield,
  Rocket,
  ExternalLink,
  Plus,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react'

const statusConfig: Record<WebPageStatus, { label: string; color: string; progress: number }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500', progress: 10 },
  in_development: { label: 'En desarrollo', color: 'bg-blue-500', progress: 40 },
  review: { label: 'En revisi\u00f3n', color: 'bg-yellow-500', progress: 70 },
  published: { label: 'Publicada', color: 'bg-green-500', progress: 100 },
  maintenance: { label: 'Mantenimiento', color: 'bg-orange-500', progress: 100 },
}

const changeStatusIcon: Record<string, React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

const changeStatusLabel: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
}

export default function ClientWebPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const webPage = useMemo(() => {
    if (!user) return null
    return mockWebPages.find((p) => p.clientId === user.id) || null
  }, [user])

  const changes = useMemo(() => {
    if (!webPage) return []
    return mockWebPageChanges
      .filter((c) => c.webPageId === webPage.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [webPage])

  if (!webPage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi P\u00e1gina Web</h1>
          <p className="text-muted-foreground">
            Informaci\u00f3n y estado de tu p\u00e1gina web
          </p>
        </div>
        <EmptyState
          icon={<Globe size={28} />}
          title="Sin p\u00e1gina web"
          description="A\u00fan no tienes una p\u00e1gina web configurada. Contacta al equipo para comenzar."
          action={{
            label: 'Solicitar p\u00e1gina web',
            onClick: () => router.push('/client/requests/new'),
          }}
        />
      </div>
    )
  }

  const status = statusConfig[webPage.status]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi P\u00e1gina Web</h1>
        <p className="text-muted-foreground">
          Informaci\u00f3n y estado de tu p\u00e1gina web
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado actual</p>
              <Badge className={status.color + ' text-white text-base px-4 py-1.5 hover:' + status.color}>
                {status.label}
              </Badge>
            </div>
            {webPage.url && (
              <a href={webPage.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visitar sitio
                </Button>
              </a>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Site Info */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dominio</p>
                <p className="font-medium">{webPage.domain || '\u2014'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">URL</p>
                {webPage.url ? (
                  <a
                    href={webPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {webPage.url}
                  </a>
                ) : (
                  <p className="font-medium">\u2014</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Certificado SSL</p>
                <p className="font-medium">
                  {webPage.sslExpiry
                    ? 'Expira: ' + new Date(webPage.sslExpiry).toLocaleDateString('es-MX')
                    : 'No configurado'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">\u00daltimo despliegue</p>
                <p className="font-medium">
                  {webPage.lastDeployedAt
                    ? new Date(webPage.lastDeployedAt).toLocaleDateString('es-MX')
                    : 'Pendiente'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cambios recientes</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/client/requests/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Solicitar cambio
          </Button>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay cambios registrados a\u00fan.
            </p>
          ) : (
            <div className="space-y-4">
              {changes.map((change, idx) => (
                <div key={change.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{changeStatusIcon[change.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{change.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {changeStatusLabel[change.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {change.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(change.createdAt).toLocaleDateString('es-MX')}
                        </span>
                        {change.completedAt && (
                          <span>
                            Completado: {new Date(change.completedAt).toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx < changes.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
