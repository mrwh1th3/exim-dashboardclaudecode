'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { SocialPost, PostStatus, PostFeedback } from '@/types/social'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CheckCircle, MessageSquare, AlertTriangle, Megaphone, Eye } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { ServiceNotAvailable } from '@/components/shared/service-not-available'
import { useClientServices } from '@/hooks/use-client-services'

const statusBadgeMap: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-700' },
  pending_review: { label: 'Pendiente de revisión', className: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
  pending_approval: { label: 'Pendiente', className: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
  changes_requested: { label: 'Cambios solicitados', className: 'bg-orange-50 text-orange-700 border-orange-300' },
  max_rounds_reached: { label: 'Límite alcanzado', className: 'bg-red-50 text-red-700 border-red-300' },
  approved: { label: 'Aprobado', className: 'bg-blue-50 text-blue-700' },
  scheduled: { label: 'Programado', className: 'bg-purple-50 text-purple-700' },
  published: { label: 'Publicado', className: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rechazado', className: 'bg-red-50 text-red-700' },
}

function RoundsCounter({ used, max, type }: { used: number; max: number; type: string }) {
  const remaining = max - used
  const isLast = remaining === 1
  const isExhausted = remaining <= 0
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${isExhausted ? 'bg-red-50 text-red-700 border-red-200' : isLast ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-muted text-muted-foreground border-border'}`}>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className={`h-2 w-2 rounded-full ${i < used ? 'bg-current' : 'bg-current opacity-25'}`} />
        ))}
      </div>
      {isExhausted
        ? `Límite de cambios alcanzado`
        : `${remaining} ${remaining === 1 ? 'cambio' : 'cambios'} restante${remaining === 1 ? '' : 's'} · ${type === 'story' ? 'Story' : 'Post'}`}
    </div>
  )
}

function PostCard({ post, onApprove, onRequestChanges, onEscalate, onViewDetail }: {
  post: SocialPost
  onApprove: (p: SocialPost) => void
  onRequestChanges: (p: SocialPost) => void
  onEscalate: (p: SocialPost) => void
  onViewDetail: (p: SocialPost) => void
}) {
  const badge = statusBadgeMap[post.status] ?? { label: post.status, className: '' }
  const canAct = post.status !== 'published'
  const canRequestChanges = canAct && post.status !== 'max_rounds_reached' && post.changeRounds < post.maxRounds
  const canEscalate = post.status === 'max_rounds_reached'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{post.title || post.content.slice(0, 50)}</span>
              <Badge variant="outline" className="text-xs capitalize">{post.type}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {post.scheduledDate ? `${post.scheduledDate} ${post.scheduledTime ?? ''}` : 'Sin fecha'}
              {post.platforms.length > 0 && ` · ${post.platforms.join(', ')}`}
            </p>
          </div>
          <Badge variant="outline" className={`shrink-0 text-xs ${badge.className}`}>{badge.label}</Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>

        {post.mediaUrls.length > 0 && (
          <div className="flex gap-1 mb-3">
            {post.mediaUrls.slice(0, 3).map((url, i) => (
              <img key={i} src={url} alt="" className="h-16 w-16 rounded object-cover border" />
            ))}
            {post.mediaUrls.length > 3 && <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">+{post.mediaUrls.length - 3}</div>}
          </div>
        )}

        {canAct ? (
          <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
            <RoundsCounter used={post.changeRounds} max={post.maxRounds} type={post.type} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onViewDetail(post)}>
                <Eye className="h-3.5 w-3.5 mr-1" />Ver
              </Button>
              {canEscalate && (
                <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => onEscalate(post)}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />Escalar
                </Button>
              )}
              {canRequestChanges && (
                <Button variant="outline" size="sm" onClick={() => onRequestChanges(post)}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />Pedir cambios
                </Button>
              )}
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onApprove(post)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />Aprobar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
            <span className="text-xs text-muted-foreground">No requiere acción inmediata</span>
            <Button variant="outline" size="sm" onClick={() => onViewDetail(post)}>
              <Eye className="h-3.5 w-3.5 mr-1" />Ver detalles completas
            </Button>
          </div>
        )}

        {post.status === 'max_rounds_reached' && !canEscalate && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Límite de cambios alcanzado. Solo puedes aprobar o escalar al equipo.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ClientPostsPage() {
  const { user } = useAuthStore()
  const { hasSocialMedia, loading: servicesLoading } = useClientServices()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)

  // Show service not available if client doesn't have social media service
  if (!servicesLoading && !hasSocialMedia) {
    return <ServiceNotAvailable serviceName="Redes Sociales" />
  }
  // Change request dialog
  const [changeDialog, setChangeDialog] = useState(false)
  const [changeTarget, setChangeTarget] = useState<SocialPost | null>(null)
  const [changeMessage, setChangeMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Escalate dialog
  const [escalateDialog, setEscalateDialog] = useState(false)
  const [escalateTarget, setEscalateTarget] = useState<SocialPost | null>(null)
  // Preview
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setPosts(
        (data ?? []).map((p: any) => ({
          id: p.id,
          clientId: p.client_id,
          clientName: '',
          type: p.type ?? 'post',
          title: p.title ?? undefined,
          content: p.content ?? '',
          mediaUrls: p.media_urls ?? [],
          platforms: p.platforms ?? [],
          scheduledDate: p.scheduled_date ?? undefined,
          scheduledTime: p.scheduled_time ?? undefined,
          status: p.status as PostStatus,
          changeRounds: p.change_rounds ?? 0,
          maxRounds: p.max_rounds ?? 3,
          canvaDesignId: p.canva_design_id ?? undefined,
          approvedBy: p.approved_by ?? undefined,
          notes: p.notes ?? undefined,
          createdBy: p.created_by,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))
      )
      setLoading(false)
    })()
  }, [user?.id])

  async function handleApprove(post: SocialPost) {
    const supabase = createClient()
    const { error } = await supabase
      .from('posts')
      .update({ status: 'scheduled', approved_by: user?.id, updated_at: new Date().toISOString() })
      .eq('id', post.id)
    if (error) { toast.error('Error al aprobar'); return }
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: 'scheduled' as PostStatus } : p))
    toast.success('Post aprobado y agendado automáticamente')
  }

  function openRequestChanges(post: SocialPost) {
    setChangeTarget(post)
    setChangeMessage('')
    setChangeDialog(true)
  }

  async function handleSubmitChanges() {
    if (!changeTarget || !changeMessage.trim()) { toast.error('Escribe tus comentarios'); return }
    if (!user?.id) return
    setSubmitting(true)
    const supabase = createClient()
    const currentRounds = changeTarget.changeRounds
    const max = changeTarget.maxRounds
    const newRounds = currentRounds + 1

    if (newRounds > max) {
      toast.error('No puedes solicitar más cambios — límite alcanzado')
      setChangeDialog(false)
      setSubmitting(false)
      return
    }

    const reachedMax = newRounds >= max
    const { error } = await supabase
      .from('posts')
      .update({
        status: reachedMax ? 'max_rounds_reached' : 'changes_requested',
        change_rounds: newRounds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', changeTarget.id)

    if (error) { toast.error('Error'); setSubmitting(false); return }

    await supabase.from('post_feedback').insert({
      post_id: changeTarget.id,
      client_id: user.id,
      author_role: 'client',
      message: changeMessage,
      round_number: newRounds,
      status: 'open',
    })

    setPosts((prev) =>
      prev.map((p) =>
        p.id === changeTarget.id
          ? { ...p, status: (reachedMax ? 'max_rounds_reached' : 'changes_requested') as PostStatus, changeRounds: newRounds }
          : p
      )
    )
    toast.success(reachedMax ? 'Cambios enviados — esta fue la última ronda disponible' : `Cambios enviados (ronda ${newRounds} de ${max})`)
    setChangeDialog(false)
    setSubmitting(false)
  }

  function openEscalate(post: SocialPost) {
    setEscalateTarget(post)
    setEscalateDialog(true)
  }

  async function handleEscalate() {
    if (!escalateTarget || !user?.id) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('posts').update({ notes: 'ESCALADO A ADMIN', updated_at: new Date().toISOString() }).eq('id', escalateTarget.id)
    await supabase.from('post_feedback').insert({
      post_id: escalateTarget.id,
      client_id: user.id,
      author_role: 'client',
      message: 'ESCALADO: El cliente solicita intervención del Agency Admin.',
      round_number: 0,
      status: 'open',
    })
    toast.success('Escalado al equipo de agencia')
    setEscalateDialog(false)
    setSubmitting(false)
  }

  function openPreview(post: SocialPost) {
    setPreviewPost(post)
    setPreviewDialog(true)
  }

  const pending = posts.filter((p) => ['pending_review', 'pending_approval', 'changes_requested', 'max_rounds_reached'].includes(p.status))
  const scheduled = posts.filter((p) => ['approved', 'scheduled'].includes(p.status))
  const published = posts.filter((p) => p.status === 'published')
  const allOther = posts.filter((p) => ['draft', 'rejected'].includes(p.status))

  if (loading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-64 animate-pulse rounded bg-muted" /></div>

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Publicaciones</h2>
        <p className="text-muted-foreground">Revisa y aprueba tu contenido de redes sociales</p>
      </div>

      {pending.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Tienes <strong>{pending.length}</strong> {pending.length === 1 ? 'publicación pendiente' : 'publicaciones pendientes'} de revisión</span>
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendientes {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
          <TabsTrigger value="scheduled">Programados {scheduled.length > 0 && `(${scheduled.length})`}</TabsTrigger>
          <TabsTrigger value="published">Publicados {published.length > 0 && `(${published.length})`}</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-3">
          {pending.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Sin pendientes" description="No tienes publicaciones esperando tu revisión." />
          ) : pending.map((post) => (
            <PostCard key={post.id} post={post} onApprove={handleApprove} onRequestChanges={openRequestChanges} onEscalate={openEscalate} onViewDetail={openPreview} />
          ))}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-3 mt-3">
          {scheduled.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Sin programados" description="Nada programado por el momento." />
          ) : scheduled.map((post) => (
            <PostCard key={post.id} post={post} onApprove={handleApprove} onRequestChanges={openRequestChanges} onEscalate={openEscalate} onViewDetail={openPreview} />
          ))}
        </TabsContent>

        <TabsContent value="published" className="space-y-3 mt-3">
          {published.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Sin publicados" description="Aún no hay publicaciones publicadas." />
          ) : published.map((post) => (
            <PostCard key={post.id} post={post} onApprove={handleApprove} onRequestChanges={openRequestChanges} onEscalate={openEscalate} onViewDetail={openPreview} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-3">
          {posts.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Sin publicaciones" description="Tu equipo aún no ha creado publicaciones para tu marca." />
          ) : posts.map((post) => (
            <PostCard key={post.id} post={post} onApprove={handleApprove} onRequestChanges={openRequestChanges} onEscalate={openEscalate} onViewDetail={openPreview} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Request changes dialog */}
      <Dialog open={changeDialog} onOpenChange={setChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar cambios</DialogTitle>
            <DialogDescription>
              {changeTarget && (
                <span>Ronda {changeTarget.changeRounds + 1} de {changeTarget.maxRounds} · {changeTarget.type === 'story' ? 'Story' : 'Post'}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {changeTarget && (
            <div className="space-y-3">
              <RoundsCounter used={changeTarget.changeRounds} max={changeTarget.maxRounds} type={changeTarget.type} />
              {changeTarget.type === 'story' && changeTarget.changeRounds === 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Las stories tienen <strong>1 sola ronda de cambios</strong>. Una vez enviados, solo podrás aprobar.</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium">Tus comentarios</label>
                <Textarea
                  value={changeMessage}
                  onChange={(e) => setChangeMessage(e.target.value)}
                  placeholder="Describe los cambios que necesitas..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmitChanges} disabled={submitting || !changeMessage.trim()}>
              {submitting ? 'Enviando...' : 'Enviar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate dialog */}
      <Dialog open={escalateDialog} onOpenChange={setEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalar al equipo de agencia</DialogTitle>
            <DialogDescription>Se enviará una notificación urgente al Agency Admin para resolver esta situación fuera del flujo normal.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEscalate} disabled={submitting}>
              {submitting ? 'Escalando...' : 'Sí, escalar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Sheet (matches Admin layout) */}
      <Sheet open={previewDialog} onOpenChange={setPreviewDialog}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {previewPost && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {previewPost.type === 'story' ? '📱' : '🖼'}
                  {previewPost.title || 'Detalle de la publicación'}
                </SheetTitle>
                <SheetDescription>
                  {previewPost.scheduledDate ? `${previewPost.scheduledDate} ${previewPost.scheduledTime ?? ''}` : 'Sin fecha'}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Badge className={statusBadgeMap[previewPost.status]?.className ?? ''}>
                    {statusBadgeMap[previewPost.status]?.label ?? previewPost.status}
                  </Badge>
                  {previewPost.changeRounds > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {previewPost.changeRounds}/{previewPost.maxRounds} rondas usadas
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Plataformas</h4>
                  <div className="flex gap-2 flex-wrap">
                    {previewPost.platforms.map((p) => (
                      <Badge key={p} variant="secondary" className="capitalize px-3 py-1 bg-muted">{p}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Contenido de la publicación</h4>
                  <div className="text-sm whitespace-pre-wrap text-foreground bg-muted/60 p-4 rounded-xl border">
                    {previewPost.content}
                  </div>
                </div>

                {previewPost.mediaUrls.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Imágenes / Videos</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {previewPost.mediaUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border bg-muted/30">
                          {url.match(/\.(mp4|webm)$/i) ? (
                            <video src={url} className="object-cover w-full h-full" controls />
                          ) : (
                            <img src={url} alt={`Media ${i + 1}`} className="object-cover w-full h-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
