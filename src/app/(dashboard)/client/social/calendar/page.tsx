'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { mockPosts } from '@/data/mock-posts'
import { SocialPost, PostStatus } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
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
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobado',
  scheduled: 'Programado',
  published: 'Publicado',
  rejected: 'Rechazado',
}

const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function ClientSocialCalendarPage() {
  const { user } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1))
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const clientPosts = useMemo(() => {
    return mockPosts.filter((p) => p.clientId === user?.id)
  }, [user?.id])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const getPostsForDay = (day: Date) => {
    return clientPosts.filter((post) => {
      if (!post.scheduledDate) return false
      return isSameDay(parseISO(post.scheduledDate), day)
    })
  }

  const handlePostClick = (post: SocialPost) => {
    setSelectedPost(post)
    setDialogOpen(true)
  }

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentMonth.getMonth()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calendario de Publicaciones</h2>
        <p className="text-muted-foreground">Visualiza tus publicaciones programadas en redes sociales</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusLabels).map(([key, label]) => (
          <span
            key={key}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusColors[key as PostStatus]}`}
          >
            {label}
          </span>
        ))}
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
            {dayHeaders.map((day) => (
              <div key={day} className="bg-muted-foreground/5 p-2 text-center text-sm font-medium">
                {day}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dayPosts = getPostsForDay(day)
              const inMonth = isCurrentMonth(day)
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] bg-background p-1.5 ${!inMonth ? 'opacity-40' : ''}`}
                >
                  <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {dayPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className={`w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity ${statusColors[post.status]}`}
                      >
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

      {/* Post Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPost.title || 'Post sin título'}</DialogTitle>
                <DialogDescription>
                  {selectedPost.scheduledDate} {selectedPost.scheduledTime}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedPost.status === 'pending_approval' && (
                  <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                    <p className="text-sm text-yellow-800">Pendiente de aprobación</p>
                  </div>
                )}

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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
