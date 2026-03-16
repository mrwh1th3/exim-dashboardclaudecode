'use client'

import { useState, useMemo } from 'react'
import { mockPosts } from '@/data/mock-posts'
import { mockClients } from '@/data/mock-clients'
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
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  getDay,
  startOfWeek,
  endOfWeek,
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
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  approved: 'Aprobado',
  scheduled: 'Programado',
  published: 'Publicado',
  rejected: 'Rechazado',
}

const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function SocialCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)) // March 2026
  const [posts, setPosts] = useState(mockPosts)
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    platforms: [] as string[],
    scheduledDate: '',
    scheduledTime: '',
    clientId: '',
  })

  const filteredPosts = useMemo(() => {
    if (filterClient === 'all') return posts
    return posts.filter((p) => p.clientId === filterClient)
  }, [posts, filterClient])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const getPostsForDay = (day: Date) => {
    return filteredPosts.filter((post) => {
      if (!post.scheduledDate) return false
      return isSameDay(parseISO(post.scheduledDate), day)
    })
  }

  const handlePostClick = (post: SocialPost) => {
    setSelectedPost(post)
    setSheetOpen(true)
  }

  const handleTogglePlatform = (platform: string) => {
    setNewPost((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.clientId || !newPost.scheduledDate) {
      toast.error('Título, cliente y fecha son requeridos')
      return
    }
    const client = mockClients.find((c) => c.id === newPost.clientId)
    const post: SocialPost = {
      id: `post-${Date.now()}`,
      clientId: newPost.clientId,
      clientName: client?.fullName ?? '',
      title: newPost.title,
      content: newPost.content,
      mediaUrls: [],
      platforms: newPost.platforms as SocialPost['platforms'],
      scheduledDate: newPost.scheduledDate,
      scheduledTime: newPost.scheduledTime,
      status: 'draft',
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPosts([...posts, post])
    setNewPost({ title: '', content: '', platforms: [], scheduledDate: '', scheduledTime: '', clientId: '' })
    setDialogOpen(false)
    toast.success('Post creado exitosamente')
  }

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentMonth.getMonth()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario de Contenido</h2>
          <p className="text-muted-foreground">Visualiza y gestiona las publicaciones programadas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Post
            </Button>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Título del post"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Escribe el contenido del post..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex flex-wrap gap-3">
                  {['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin'].map((platform) => (
                    <label key={platform} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newPost.platforms.includes(platform)}
                        onCheckedChange={() => handleTogglePlatform(platform)}
                      />
                      <span className="capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={newPost.scheduledDate}
                    onChange={(e) => setNewPost({ ...newPost, scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={newPost.scheduledTime}
                    onChange={(e) => setNewPost({ ...newPost, scheduledTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePost}>Crear Post</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {mockClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 ml-auto">
          {Object.entries(statusLabels).map(([key, label]) => (
            <span
              key={key}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColors[key as PostStatus]}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
            {/* Day headers */}
            {dayHeaders.map((day) => (
              <div key={day} className="bg-muted-foreground/5 p-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
            {/* Day cells */}
            {calendarDays.map((day) => {
              const dayPosts = getPostsForDay(day)
              const inMonth = isCurrentMonth(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] bg-background p-1.5 ${
                    !inMonth ? 'opacity-40' : ''
                  }`}
                >
                  <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {dayPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className={`w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5 ${statusColors[post.status]}`}
                      >
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

      {/* Post Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          {selectedPost && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedPost.title || 'Post sin título'}</SheetTitle>
                <SheetDescription>
                  {selectedPost.clientName} - {selectedPost.scheduledDate} {selectedPost.scheduledTime}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <Badge className={statusColors[selectedPost.status]}>
                    {statusLabels[selectedPost.status]}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Plataformas</h4>
                  <div className="flex gap-1">
                    {selectedPost.platforms.map((p) => (
                      <Badge key={p} variant="outline" className="capitalize">
                        {p}
                      </Badge>
                    ))}
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
