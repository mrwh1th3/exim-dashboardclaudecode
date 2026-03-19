'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { SocialPost, PostStatus, PostType } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, AlertTriangle, ImageIcon, CheckCircle, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  addMonths, subMonths, isSameDay, parseISO, startOfWeek, endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  pending_review: 'bg-yellow-200 text-yellow-800',
  pending_approval: 'bg-yellow-200 text-yellow-800',
  changes_requested: 'bg-orange-200 text-orange-800',
  max_rounds_reached: 'bg-red-200 text-red-800',
  approved: 'bg-blue-200 text-blue-800',
  scheduled: 'bg-purple-200 text-purple-800',
  published: 'bg-green-200 text-green-800',
  rejected: 'bg-red-200 text-red-800',
}
const statusLabels: Record<string, string> = {
  draft: 'Borrador', pending_review: 'Pendiente de aprobación', pending_approval: 'Pendiente de aprobación',
  changes_requested: 'Cambios solicitados', max_rounds_reached: 'Límite de cambios',
  approved: 'Aprobado', scheduled: 'Programado', published: 'Publicado', rejected: 'Rechazado',
}
const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function ClientSocialCalendarPage() {
  const { user } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [clientPosts, setClientPosts] = useState<SocialPost[]>([])
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  // Actions
  const [changeMessage, setChangeMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [escalateDialog, setEscalateDialog] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('posts').select('*').eq('client_id', user!.id).order('scheduled_date')
      setClientPosts(
        (data ?? []).map((p: any) => ({
          id: p.id, clientId: p.client_id, clientName: '',
          type: (p.type ?? 'post') as PostType,
          title: p.title ?? undefined, content: p.content ?? '',
          mediaUrls: p.media_urls ?? [], platforms: p.platforms ?? [],
          scheduledDate: p.scheduled_date ?? undefined, scheduledTime: p.scheduled_time ?? undefined,
          status: p.status as PostStatus,
          changeRounds: p.change_rounds ?? 0, maxRounds: p.max_rounds ?? 3,
          canvaDesignId: p.canva_design_id ?? undefined,
          createdBy: p.created_by, createdAt: p.created_at, updatedAt: p.updated_at,
        }))
      )
    }
    load()
  }, [user?.id])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) })
  }, [currentMonth])

  const getPostsForDay = (day: Date) =>
    clientPosts.filter((post) => post.scheduledDate && isSameDay(parseISO(post.scheduledDate), day))

  const pendingCount = clientPosts.filter((p) => ['pending_review', 'pending_approval'].includes(p.status)).length

  function openPost(post: SocialPost) {
    setSelectedPost(post)
    setChangeMessage('')
    setDialogOpen(true)
  }

  async function handleApprove() {
    if (!selectedPost || !user?.id) return
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('posts')
      .update({ status: 'scheduled', approved_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', selectedPost.id)
    if (error) { toast.error('Error al aprobar'); setSubmitting(false); return }
    setClientPosts((prev) => prev.map((p) => p.id === selectedPost.id ? { ...p, status: 'scheduled' as PostStatus } : p))
    setSelectedPost((p) => p ? { ...p, status: 'scheduled' as PostStatus } : p)
    toast.success('Post aprobado y agendado automáticamente')
    setSubmitting(false)
  }

  async function handleRequestChanges() {
    if (!selectedPost || !changeMessage.trim() || !user?.id) return
    setSubmitting(true)
    const supabase = createClient()
    const newRounds = selectedPost.changeRounds + 1
    const max = selectedPost.maxRounds
    if (newRounds > max) { toast.error('Límite de cambios alcanzado'); setSubmitting(false); return }
    const reachedMax = newRounds >= max
    const { error } = await supabase
      .from('posts')
      .update({ status: reachedMax ? 'max_rounds_reached' : 'changes_requested', change_rounds: newRounds, updated_at: new Date().toISOString() })
      .eq('id', selectedPost.id)
    if (error) { toast.error('Error'); setSubmitting(false); return }
    await supabase.from('post_feedback').insert({
      post_id: selectedPost.id, client_id: user.id, author_role: 'client',
      message: changeMessage, round_number: newRounds, status: 'open',
    })
    const newStatus = (reachedMax ? 'max_rounds_reached' : 'changes_requested') as PostStatus
    setClientPosts((prev) => prev.map((p) => p.id === selectedPost.id ? { ...p, status: newStatus, changeRounds: newRounds } : p))
    setSelectedPost((p) => p ? { ...p, status: newStatus, changeRounds: newRounds } : p)
    toast.success(reachedMax ? 'Cambios enviados — última ronda disponible' : `Cambios enviados (${newRounds}/${max})`)
    setChangeMessage('')
    setSubmitting(false)
  }

  async function handleEscalate() {
    if (!selectedPost || !user?.id) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('posts').update({ notes: 'ESCALADO A ADMIN', updated_at: new Date().toISOString() }).eq('id', selectedPost.id)
    await supabase.from('post_feedback').insert({
      post_id: selectedPost.id, client_id: user.id, author_role: 'client',
      message: 'ESCALADO: El cliente solicita intervención del Agency Admin.', round_number: 0, status: 'open',
    })
    toast.success('Escalado al equipo de agencia')
    setEscalateDialog(false)
    setSubmitting(false)
  }

  const canAct = (post: SocialPost) => ['pending_review', 'pending_approval', 'changes_requested', 'max_rounds_reached'].includes(post.status)
  const canRequestChanges = (post: SocialPost) => canAct(post) && post.status !== 'max_rounds_reached' && post.changeRounds < post.maxRounds

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calendario de Publicaciones</h2>
        <p className="text-muted-foreground">Visualiza y aprueba tus publicaciones programadas</p>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Tienes <strong>{pendingCount}</strong> publicación(es) pendiente(s) de aprobación</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusLabels).map(([key, label]) => (
          <span key={key} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColors[key]}`}>{label}</span>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-5 w-5" /></Button>
            <CardTitle className="text-lg capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
            {dayHeaders.map((day) => (
              <div key={day} className="bg-muted-foreground/5 p-2 text-center text-sm font-medium">{day}</div>
            ))}
            {calendarDays.map((day) => {
              const dayPosts = getPostsForDay(day)
              const inMonth = day.getMonth() === currentMonth.getMonth()
              return (
                <div key={day.toISOString()} className={`min-h-[100px] bg-background p-1.5 ${!inMonth ? 'opacity-40' : ''}`}>
                  <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {dayPosts.map((post) => (
                      <button key={post.id} onClick={() => openPost(post)}
                        className={`w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5 ${statusColors[post.status] ?? 'bg-gray-100'}`}>
                        {post.type === 'story' ? '📱' : <ImageIcon className="h-2.5 w-2.5 shrink-0" />}
                        {post.title || post.content.slice(0, 30)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Post detail & actions dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedPost.type === 'story' ? '📱' : '🖼'}
                  {selectedPost.title || 'Post sin título'}
                </DialogTitle>
                <DialogDescription>{selectedPost.scheduledDate} {selectedPost.scheduledTime}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColors[selectedPost.status]}>{statusLabels[selectedPost.status]}</Badge>
                  {selectedPost.changeRounds > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">{selectedPost.changeRounds}/{selectedPost.maxRounds} rondas usadas</span>
                  )}
                </div>

                {['pending_review', 'pending_approval'].includes(selectedPost.status) && (
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                    <p className="text-sm text-yellow-800">Pendiente de tu aprobación</p>
                  </div>
                )}

                {selectedPost.status === 'max_rounds_reached' && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700">Límite de cambios alcanzado. Solo puedes aprobar o escalar.</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1">Plataformas</h4>
                  <div className="flex gap-1 flex-wrap">
                    {selectedPost.platforms.map((p) => <Badge key={p} variant="outline" className="capitalize">{p}</Badge>)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Contenido</h4>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedPost.content}</p>
                </div>
                {selectedPost.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPost.mediaUrls.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                        <img src={url} alt={`Media ${i + 1}`} className="object-cover w-full h-full" />
                      </div>
                    ))}
                  </div>
                )}

                {canRequestChanges(selectedPost) && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Pedir cambios</label>
                    <Textarea
                      value={changeMessage}
                      onChange={(e) => setChangeMessage(e.target.value)}
                      placeholder="Describe los cambios que necesitas..."
                      rows={3}
                      className="text-sm"
                    />
                    {selectedPost.type === 'story' && selectedPost.changeRounds === 0 && (
                      <p className="text-xs text-orange-600">Las stories tienen máximo 1 ronda de cambios.</p>
                    )}
                  </div>
                )}

                {canAct(selectedPost) && (
                  <div className="flex flex-col gap-2 pt-1">
                    {selectedPost.status === 'max_rounds_reached' && (
                      <Button variant="outline" className="text-orange-600 border-orange-200" onClick={() => setEscalateDialog(true)}>
                        <AlertTriangle className="h-4 w-4 mr-2" />Escalar al equipo
                      </Button>
                    )}
                    {canRequestChanges(selectedPost) && (
                      <Button variant="outline" onClick={handleRequestChanges} disabled={submitting || !changeMessage.trim()}>
                        <MessageSquare className="h-4 w-4 mr-2" />{submitting ? 'Enviando...' : 'Enviar cambios'}
                      </Button>
                    )}
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={submitting}>
                      <CheckCircle className="h-4 w-4 mr-2" />{submitting ? 'Aprobando...' : 'Aprobar'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Escalate confirm */}
      <Dialog open={escalateDialog} onOpenChange={setEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalar al equipo de agencia</DialogTitle>
            <DialogDescription>Se enviará una notificación urgente al Agency Admin.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEscalate} disabled={submitting}>
              {submitting ? 'Escalando...' : 'Escalar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
