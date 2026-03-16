'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WebPage, WebPageStatus, WebPageChange } from '@/types/web-pages'
import { mockWebPages, mockWebPageChanges } from '@/data/mock-web-pages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Globe,
  Shield,
  Rocket,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react'

const statusConfig: Record<WebPageStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500' },
  in_development: { label: 'En desarrollo', color: 'bg-blue-500' },
  review: { label: 'En revisi\u00f3n', color: 'bg-yellow-500' },
  published: { label: 'Publicada', color: 'bg-green-500' },
  maintenance: { label: 'Mantenimiento', color: 'bg-orange-500' },
}

const statusOrder: WebPageStatus[] = ['draft', 'in_development', 'review', 'published', 'maintenance']

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

export default function AdminWebPageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.pageId as string

  const [page, setPage] = useState<WebPage | null>(
    mockWebPages.find((p) => p.id === pageId) || null
  )
  const [changes, setChanges] = useState<WebPageChange[]>(
    mockWebPageChanges.filter((c) => c.webPageId === pageId)
  )
  const [addChangeOpen, setAddChangeOpen] = useState(false)
  const [changeTitle, setChangeTitle] = useState('')
  const [changeDescription, setChangeDescription] = useState('')

  if (!page) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/web')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">P\u00e1gina no encontrada</h2>
          <p className="text-muted-foreground mt-1">
            La p\u00e1gina web que buscas no existe.
          </p>
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: WebPageStatus) => {
    setPage((prev) => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null)
    toast.success('Estado actualizado a: ' + statusConfig[newStatus].label)
  }

  const handleAddChange = () => {
    if (!changeTitle.trim()) return
    const newChange: WebPageChange = {
      id: 'wpc-' + Date.now(),
      webPageId: pageId,
      title: changeTitle.trim(),
      description: changeDescription.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setChanges((prev) => [newChange, ...prev])
    setChangeTitle('')
    setChangeDescription('')
    setAddChangeOpen(false)
    toast.success('Cambio registrado')
  }

  const currentStatus = statusConfig[page.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/web')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {page.clientName}
          </h1>
          <p className="text-muted-foreground">{page.domain || 'Sin dominio'}</p>
        </div>
        <Badge className={currentStatus.color + ' text-white text-sm px-3 py-1 hover:' + currentStatus.color}>
          {currentStatus.label}
        </Badge>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informaci\u00f3n del sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dominio</p>
                <p className="font-medium">{page.domain || '\u2014'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">URL</p>
                {page.url ? (
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {page.url}
                  </a>
                ) : (
                  <p className="font-medium">\u2014</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">SSL Expira</p>
                <p className="font-medium">
                  {page.sslExpiry
                    ? new Date(page.sslExpiry).toLocaleDateString('es-MX')
                    : '\u2014'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">\u00daltimo despliegue</p>
                <p className="font-medium">
                  {page.lastDeployedAt
                    ? new Date(page.lastDeployedAt).toLocaleDateString('es-MX')
                    : '\u2014'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{page.planId || '\u2014'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Change */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {statusOrder.map((status) => {
              const config = statusConfig[status]
              const isActive = page.status === status
              return (
                <Button
                  key={status}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={isActive ? config.color + ' text-white hover:' + config.color : ''}
                  onClick={() => handleStatusChange(status)}
                >
                  {config.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Changes Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historial de cambios</CardTitle>
          <Button size="sm" onClick={() => setAddChangeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Cambio
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
                          Creado: {new Date(change.createdAt).toLocaleDateString('es-MX')}
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

      {/* Add Change Dialog */}
      <Dialog open={addChangeOpen} onOpenChange={setAddChangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Cambio</DialogTitle>
            <DialogDescription>
              Registra un nuevo cambio para esta p\u00e1gina web.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="change-title">T\u00edtulo</Label>
              <Input
                id="change-title"
                value={changeTitle}
                onChange={(e) => setChangeTitle(e.target.value)}
                placeholder="Descripci\u00f3n breve del cambio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-desc">Descripci\u00f3n</Label>
              <Textarea
                id="change-desc"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="Detalla el cambio a realizar..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChangeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddChange} disabled={!changeTitle.trim()}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
