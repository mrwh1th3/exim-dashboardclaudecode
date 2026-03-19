'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WebPage, WebPageStatus, WebPageChange } from '@/types/web-pages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  ExternalLink,
} from 'lucide-react'

const statusConfig: Record<WebPageStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500' },
  in_development: { label: 'En desarrollo', color: 'bg-blue-500' },
  review: { label: 'En revisión', color: 'bg-yellow-500' },
  published: { label: 'Publicada', color: 'bg-green-500' },
  maintenance: { label: 'Mantenimiento', color: 'bg-orange-500' },
}

const statusOrder: WebPageStatus[] = ['draft', 'in_development', 'review', 'published', 'maintenance']

const changeStatusIcon: Record<string, React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
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
  const supabase = createClient()

  const [page, setPage] = useState<WebPage | null>(null)
  const [changes, setChanges] = useState<WebPageChange[]>([])
  const [loading, setLoading] = useState(true)
  const [addChangeOpen, setAddChangeOpen] = useState(false)
  const [changeTitle, setChangeTitle] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingChangeId, setUpdatingChangeId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Load page with client profile
        const { data: pageData, error: pageError } = await supabase
          .from('web_pages')
          .select('*, profiles!web_pages_client_id_fkey(full_name, company_name)')
          .eq('id', pageId)
          .single()

        if (pageError) throw pageError

        const profile = pageData.profiles as { full_name: string; company_name: string } | null
        setPage({
          id: pageData.id,
          clientId: pageData.client_id,
          clientName: profile?.company_name ?? profile?.full_name ?? '',
          domain: pageData.domain ?? undefined,
          url: pageData.url ?? undefined,
          status: pageData.status as WebPageStatus,
          lastDeployedAt: pageData.last_deployed_at ?? undefined,
          sslExpiry: pageData.ssl_expiry ?? undefined,
          planId: pageData.plan_id ?? undefined,
          createdAt: pageData.created_at,
          updatedAt: pageData.updated_at,
        })

        // Load changes
        const { data: changesData, error: changesError } = await supabase
          .from('web_page_changes')
          .select('*')
          .eq('web_page_id', pageId)
          .order('created_at', { ascending: false })

        if (changesError) throw changesError

        setChanges(
          (changesData ?? []).map((c: any) => ({
            id: c.id,
            webPageId: c.web_page_id,
            title: c.title,
            description: c.description ?? '',
            status: c.status,
            requestId: c.request_id ?? undefined,
            createdAt: c.created_at,
            completedAt: c.completed_at ?? undefined,
          }))
        )
      } catch (err) {
        console.error('Error loading page:', err)
        toast.error('Error al cargar la página')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pageId, supabase])

  const handleStatusChange = async (newStatus: WebPageStatus) => {
    if (!page || updatingStatus) return
    setUpdatingStatus(true)
    try {
      const updateData: Record<string, unknown> = { status: newStatus }

      // If publishing, set last_deployed_at
      if (newStatus === 'published') {
        updateData.last_deployed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('web_pages')
        .update(updateData)
        .eq('id', page.id)

      if (error) throw error

      setPage((prev) => prev ? {
        ...prev,
        status: newStatus,
        lastDeployedAt: newStatus === 'published' ? new Date().toISOString() : prev.lastDeployedAt,
        updatedAt: new Date().toISOString(),
      } : null)
      toast.success('Estado actualizado a: ' + statusConfig[newStatus].label)
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAddChange = async () => {
    if (!changeTitle.trim() || !page) return
    try {
      const { data, error } = await supabase
        .from('web_page_changes')
        .insert({
          web_page_id: pageId,
          title: changeTitle.trim(),
          description: changeDescription.trim(),
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setChanges((prev) => [{
        id: data.id,
        webPageId: data.web_page_id,
        title: data.title,
        description: data.description ?? '',
        status: data.status,
        createdAt: data.created_at,
      }, ...prev])
      setChangeTitle('')
      setChangeDescription('')
      setAddChangeOpen(false)
      toast.success('Cambio registrado')
    } catch (err) {
      console.error('Error adding change:', err)
      toast.error('Error al agregar el cambio')
    }
  }

  const handleChangeStatusUpdate = async (changeId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    setUpdatingChangeId(changeId)
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('web_page_changes')
        .update(updateData)
        .eq('id', changeId)

      if (error) throw error

      setChanges((prev) =>
        prev.map((c) =>
          c.id === changeId
            ? {
                ...c,
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : c.completedAt,
              }
            : c
        )
      )
      toast.success('Estado del cambio actualizado')
    } catch (err) {
      console.error('Error updating change:', err)
      toast.error('Error al actualizar el cambio')
    } finally {
      setUpdatingChangeId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/web')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Página no encontrada</h2>
          <p className="text-muted-foreground mt-1">
            La página web que buscas no existe.
          </p>
        </div>
      </div>
    )
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
          <CardTitle>Información del sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dominio</p>
                <p className="font-medium">{page.domain || '—'}</p>
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
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {page.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="font-medium">—</p>
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
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Último despliegue</p>
                <p className="font-medium">
                  {page.lastDeployedAt
                    ? new Date(page.lastDeployedAt).toLocaleDateString('es-MX')
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{page.planId || '—'}</p>
              </div>
            </div>
          </div>

          {/* Visit Site Button */}
          {page.url && (
            <div className="mt-6 pt-4 border-t">
              <a
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-[15px] bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm h-8 gap-1.5 px-2.5 text-sm font-medium transition-colors"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visitar Sitio
              </a>
            </div>
          )}
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
                  disabled={updatingStatus}
                >
                  {updatingStatus && isActive && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              No hay cambios registrados aún.
            </p>
          ) : (
            <div className="space-y-4">
              {changes.map((change, idx) => (
                <div key={change.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{changeStatusIcon[change.status]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{change.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {changeStatusLabel[change.status]}
                        </Badge>
                      </div>
                      {change.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {change.description}
                        </p>
                      )}
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
                      {/* Change status actions */}
                      <div className="flex gap-2 mt-2">
                        {change.status !== 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeStatusUpdate(change.id, 'in_progress')}
                            disabled={updatingChangeId === change.id}
                          >
                            {updatingChangeId === change.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            En Progreso
                          </Button>
                        )}
                        {change.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeStatusUpdate(change.id, 'completed')}
                            disabled={updatingChangeId === change.id}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            {updatingChangeId === change.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Completar
                          </Button>
                        )}
                        {change.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeStatusUpdate(change.id, 'pending')}
                            disabled={updatingChangeId === change.id}
                          >
                            Reabrir
                          </Button>
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
              Registra un nuevo cambio para esta página web.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="change-title">Título</Label>
              <Input
                id="change-title"
                value={changeTitle}
                onChange={(e) => setChangeTitle(e.target.value)}
                placeholder="Descripción breve del cambio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-desc">Descripción</Label>
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
