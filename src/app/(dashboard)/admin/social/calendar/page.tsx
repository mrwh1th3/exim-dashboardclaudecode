'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { SocialPost, PostStatus } from '@/types/social'
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
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, ImageIcon } from 'lucide-react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  addMonths, subMonths, isSameDay, parseISO, startOfWeek, endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'

const statusColors: Record<PostStatus, string> = {
  draft: 'bg-gray-200 text-gray-700',
  pending_approval: 'bg-yellow-200 text-yellow-800',
  approved: 'bg-blue-200 text-blue-800',
  scheduled: 'bg-purple-200 text-purple-800',
  published: 'bg-green-200 text-green-800',
  rejected: 'bg-red-200 text-red-800',
}

const statusLabels: Record<PostStatus, string> = {
  draft: 'Borrador', pending_approval: 'Pendiente', approved: 'Aprobado',
  scheduled: 'Programado', published: 'Publicado', rejected: 'Rechazado',
}

const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface ClientOption { id: string; fullName: string }

export default function SocialCalendarPage() {
  const { user } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', platforms: [] as string[], scheduledDate: '', scheduledTime: '', clientId: '' })

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
          id: p.id,
          clientId: p.client_id,
          clientName: (p.profiles as { full_name: string } | null)?.full_name ?? '',
          title: p.title ?? undefined,
          content: p.content ?? '',
          mediaUrls: p.media_urls ?? [],
          platforms: p.platforms ?? [],
          scheduledDate: p.scheduled_date ?? undefined,
          scheduledTime: p.scheduled_time ?? undefined,
          status: p.status as PostStatus,
          createdBy: p.created_by,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
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
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.clientId || !newPost.scheduledDate) {
      toast.error('Título, cliente y fecha son requeridos')
      return
    }
    const supabase = createClient()
    const client = clients.find((c) => c.id === newPost.clientId)
    const { data, error } = await supabase
      .from('posts')
      .insert({
        client_id: newPost.clientId,
        title: newPost.title,
        content: newPost.content,
        platforms: newPost.platforms,
        scheduled_date: newPost.scheduledDate,
        scheduled_time: newPost.scheduledTime || null,
        status: 'draft',
        media_urls: [],
        created_by: user?.id,
      })
      .select()
      .single()
    if (error) { toast.error('Error al crear el post'); return }
    setPosts((prev) => [{
      id: data.id, clientId: data.client_id, clientName: client?.fullName ?? '',
      title: data.title ?? undefined, content: data.content ?? '', mediaUrls: [],
      platforms: data.platforms ?? [], scheduledDate: data.scheduled_date ?? undefined,
      scheduledTime: data.scheduled_time ?? undefined, status: data.status as PostStatus,
      createdBy: data.created_by, createdAt: data.created_at, updatedAt: data.updated_at,
    }, ...prev])
    setNewPost({ title: '', content: '', platforms: [], scheduledDate: '', scheduledTime: '', clientId: '' })
    setDialogOpen(false)
    toast.success('Post creado exitosamente')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario de Contenido</h2>
          <p className="text-muted-foreground">Visualiza y gestiona las publicaciones programadas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} dismissible={false}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Post</DialogTitle>
              <DialogDescription>Programa una nueva publicación para redes sociales.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={newPost.clientId} onValueChange={(v) => setNewPost({ ...newPost, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
            <span key={key} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColors[key as PostStatus]}`}>{label}</span>
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
                      <button key={post.id} onClick={() => { setSelectedPost(post); setSheetOpen(true) }}
                        className={`w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5 ${statusColors[post.status]}`}>
                        {post.mediaUrls.length > 0 && <ImageIcon className="h-2.5 w-2.5 shrink-0" />}
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
        <SheetContent>
          {selectedPost && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedPost.title || 'Post sin título'}</SheetTitle>
                <SheetDescription>{selectedPost.clientName} - {selectedPost.scheduledDate} {selectedPost.scheduledTime}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div><Badge className={statusColors[selectedPost.status]}>{statusLabels[selectedPost.status]}</Badge></div>
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
                {selectedPost.mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Imágenes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPost.mediaUrls.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                          <img src={url} alt={`Media ${i + 1}`} className="object-cover w-full h-full" />
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
