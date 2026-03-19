'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { SocialPost, PostStatus, PostType } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, ImageIcon, Calendar, Clock, AlertTriangle } from 'lucide-react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  addMonths, subMonths, isSameDay, parseISO, startOfWeek, endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { PostMediaUpload } from '@/components/shared/post-media-upload'

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
  draft: 'Borrador', pending_review: 'Pendiente revisión', pending_approval: 'Pendiente',
  changes_requested: 'Cambios', max_rounds_reached: 'Límite',
  approved: 'Aprobado', scheduled: 'Programado', published: 'Publicado', rejected: 'Rechazado',
}

const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface ClientOption { id: string; fullName: string }
interface CalendarLogEntry { id: string; changedBy: string; oldScheduledDate?: string; oldScheduledTime?: string; newScheduledDate?: string; newScheduledTime?: string; changedAt: string }

export default function SocialCalendarPage() {
  const { user } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', platforms: [] as string[], scheduledDate: '', scheduledTime: '', clientId: '', type: 'post' as PostType, mediaUrls: [] as string[] })
  // Calendar log
  const [calendarLog, setCalendarLog] = useState<CalendarLogEntry[]>([])
  // Edit date dialog
  const [editDateDialog, setEditDateDialog] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: postsData }, { data: clientsData }] = await Promise.all([
        supabase.from('posts').select('*, profiles!posts_client_id_fkey(full_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
      ])
      setClients((clientsData ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
      setPosts(
        (postsData ?? []).map((p: any) => ({
          id: p.id, clientId: p.client_id,
          clientName: (p.profiles as { full_name: string } | null)?.full_name ?? '',
          type: (p.type ?? 'post') as PostType,
          title: p.title ?? undefined, content: p.content ?? '',
          mediaUrls: p.media_urls ?? [], platforms: p.platforms ?? [],
          scheduledDate: p.scheduled_date ?? undefined, scheduledTime: p.scheduled_time ?? undefined,
          status: p.status as PostStatus,
          changeRounds: p.change_rounds ?? 0, maxRounds: p.max_rounds ?? 3,
          canvaDesignId: p.canva_design_id ?? undefined,
          approvedBy: p.approved_by ?? undefined,
          notes: p.notes ?? undefined, createdBy: p.created_by,
          createdAt: p.created_at, updatedAt: p.updated_at,
        }))
      )
    }
    load()
  }, [])

  const filteredPosts = useMemo(() => filterClient === 'all' ? posts : posts.filter((p) => p.clientId === filterClient), [posts, filterClient])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) })
  }, [currentMonth])

  const getPostsForDay = (day: Date) =>
    filteredPosts.filter((post) => post.scheduledDate && isSameDay(parseISO(post.scheduledDate), day))

  const handleTogglePlatform = (platform: string) => {
    setNewPost((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform) ? prev.platforms.filter((p) => p !== platform) : [...prev.platforms, platform],
    }))
  }

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.clientId || !newPost.scheduledDate) {
      toast.error('Título, cliente y fecha son requeridos')
      return
    }
    const supabase = createClient()
    const client = clients.find((c) => c.id === newPost.clientId)
    const isStory = newPost.type === 'story'
    const { data, error } = await supabase
      .from('posts')
      .insert({
        client_id: newPost.clientId,
        type: newPost.type,
        title: newPost.title,
        content: newPost.content,
        platforms: newPost.platforms,
        scheduled_date: newPost.scheduledDate,
        scheduled_time: newPost.scheduledTime || null,
        status: 'draft',
        change_rounds: 0,
        max_rounds: isStory ? 1 : 3,
        media_urls: newPost.mediaUrls,
        created_by: user?.id,
      })
      .select()
      .single()
    if (error) { toast.error('Error al crear el post'); return }
    setPosts((prev) => [{
      id: data.id, clientId: data.client_id, clientName: client?.fullName ?? '',
      type: data.type as PostType,
      title: data.title ?? undefined, content: data.content ?? '', mediaUrls: data.media_urls ?? [],
      platforms: data.platforms ?? [], scheduledDate: data.scheduled_date ?? undefined,
      scheduledTime: data.scheduled_time ?? undefined, status: data.status as PostStatus,
      changeRounds: 0, maxRounds: isStory ? 1 : 3,
      createdBy: data.created_by, createdAt: data.created_at, updatedAt: data.updated_at,
    }, ...prev])
    setNewPost({ title: '', content: '', platforms: [], scheduledDate: '', scheduledTime: '', clientId: '', type: 'post', mediaUrls: [] })
    setDialogOpen(false)
    toast.success('Post creado exitosamente')
  }

  const openPostSheet = async (post: SocialPost) => {
    setSelectedPost(post)
    setEditDate(post.scheduledDate ?? '')
    setEditTime(post.scheduledTime ?? '')
    setSheetOpen(true)
    // Load calendar log
    const supabase = createClient()
    const { data } = await supabase
      .from('calendar_log')
      .select('*')
      .eq('post_id', post.id)
      .order('changed_at', { ascending: false })
    setCalendarLog((data ?? []).map((row: any) => ({
      id: row.id,
      changedBy: row.changed_by,
      oldScheduledDate: row.old_scheduled_date ?? undefined,
      oldScheduledTime: row.old_scheduled_time ?? undefined,
      newScheduledDate: row.new_scheduled_date ?? undefined,
      newScheduledTime: row.new_scheduled_time ?? undefined,
      changedAt: row.changed_at,
    })))
  }

  const handleSaveDate = async () => {
    if (!selectedPost || !editDate) { toast.error('Fecha requerida'); return }
    if (!user?.id) return
    const supabase = createClient()

    // Log the change
    await supabase.from('calendar_log').insert({
      post_id: selectedPost.id,
      changed_by: user.id,
      old_scheduled_date: selectedPost.scheduledDate ?? null,
      old_scheduled_time: selectedPost.scheduledTime ?? null,
      new_scheduled_date: editDate,
      new_scheduled_time: editTime || null,
      changed_at: new Date().toISOString(),
    })

    // Update the post
    const { error } = await supabase
      .from('posts')
      .update({ scheduled_date: editDate, scheduled_time: editTime || null, updated_at: new Date().toISOString() })
      .eq('id', selectedPost.id)

    if (error) { toast.error('Error al actualizar fecha'); return }

    const updatedPost = { ...selectedPost, scheduledDate: editDate, scheduledTime: editTime || undefined }
    setPosts((prev) => prev.map((p) => p.id === selectedPost.id ? updatedPost : p))
    setSelectedPost(updatedPost)
    setEditDateDialog(false)
    toast.success('Fecha actualizada y registrada en el log')

    // Reload log
    const { data } = await supabase
      .from('calendar_log')
      .select('*')
      .eq('post_id', selectedPost.id)
      .order('changed_at', { ascending: false })
    setCalendarLog((data ?? []).map((row: any) => ({
      id: row.id, changedBy: row.changed_by,
      oldScheduledDate: row.old_scheduled_date ?? undefined, oldScheduledTime: row.old_scheduled_time ?? undefined,
      newScheduledDate: row.new_scheduled_date ?? undefined, newScheduledTime: row.new_scheduled_time ?? undefined,
      changedAt: row.changed_at,
    })))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario de Contenido</h2>
          <p className="text-muted-foreground">Visualiza y gestiona las publicaciones programadas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} disablePointerDismissal={true}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Post</DialogTitle>
              <DialogDescription>Programa una nueva publicación para redes sociales.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={newPost.clientId} onValueChange={(v) => setNewPost({ ...newPost, clientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newPost.type} onValueChange={(v) => setNewPost({ ...newPost, type: v as PostType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">🖼 Post</SelectItem>
                      <SelectItem value="story">📱 Story</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newPost.type === 'story' && (
                <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Las stories tienen <strong>máximo 1 ronda de cambios</strong>.</span>
                </div>
              )}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} placeholder="Título del post" />
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} placeholder="Escribe el contenido..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex flex-wrap gap-3">
                  {['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin'].map((platform) => (
                    <label key={platform} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={newPost.platforms.includes(platform)} onCheckedChange={() => handleTogglePlatform(platform)} />
                      <span className="capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imágenes / Videos</Label>
                <PostMediaUpload
                  clientId={newPost.clientId}
                  uploadedBy={user?.id ?? ''}
                  value={newPost.mediaUrls}
                  onChange={(urls) => setNewPost({ ...newPost, mediaUrls: urls })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={newPost.scheduledDate} onChange={(e) => setNewPost({ ...newPost, scheduledDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" value={newPost.scheduledTime} onChange={(e) => setNewPost({ ...newPost, scheduledTime: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreatePost}>Crear Post</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger><SelectValue placeholder="Filtrar por cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 ml-auto">
          {Object.entries(statusLabels).map(([key, label]) => (
            <span key={key} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColors[key]}`}>{label}</span>
          ))}
        </div>
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
                      <button key={post.id} onClick={() => openPostSheet(post)}
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          {selectedPost && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedPost.type === 'story' ? '📱' : '🖼'}
                  {selectedPost.title || 'Post sin título'}
                </SheetTitle>
                <SheetDescription>{selectedPost.clientName}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[selectedPost.status]}>{statusLabels[selectedPost.status]}</Badge>
                  {selectedPost.changeRounds > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">{selectedPost.changeRounds}/{selectedPost.maxRounds} rondas</span>
                  )}
                </div>

                {/* Date editor */}
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{selectedPost.scheduledDate || 'Sin fecha'}</p>
                        {selectedPost.scheduledTime && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{selectedPost.scheduledTime}</p>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditDateDialog(true)}>Editar fecha</Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Plataformas</h4>
                  <div className="flex gap-1">
                    {selectedPost.platforms.map((p) => <Badge key={p} variant="outline" className="capitalize">{p}</Badge>)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Contenido</h4>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedPost.content}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Imágenes / Videos</h4>
                  <PostMediaUpload
                    clientId={selectedPost.clientId}
                    uploadedBy={user?.id ?? ''}
                    value={selectedPost.mediaUrls}
                    onChange={async (urls) => {
                      const supabase = createClient()
                      await supabase.from('posts').update({ media_urls: urls, updated_at: new Date().toISOString() }).eq('id', selectedPost.id)
                      const updated = { ...selectedPost, mediaUrls: urls }
                      setSelectedPost(updated)
                      setPosts((prev) => prev.map((p) => p.id === selectedPost.id ? updated : p))
                    }}
                  />
                </div>

                {/* Calendar log */}
                {calendarLog.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Historial de cambios de fecha</h4>
                      <div className="space-y-2">
                        {calendarLog.map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-muted/40 p-2 text-xs">
                            <p className="text-muted-foreground">
                              {new Date(entry.changedAt).toLocaleString('es-MX')}
                            </p>
                            <p>
                              <span className="line-through text-muted-foreground">{entry.oldScheduledDate} {entry.oldScheduledTime}</span>
                              {' → '}
                              <span className="font-medium">{entry.newScheduledDate} {entry.newScheduledTime}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit date dialog */}
      <Dialog open={editDateDialog} onOpenChange={setEditDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fecha de publicación</DialogTitle>
            <DialogDescription>Este cambio se registrará en el historial del post.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-3">
            <div className="space-y-2">
              <Label>Nueva fecha</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nueva hora</Label>
              <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDateDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveDate}>Confirmar cambio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
