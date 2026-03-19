'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SocialPost, PostStatus, Platform, PostType } from '@/types/social'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Edit, AlertTriangle } from 'lucide-react'

const statusBadgeMap: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string; label: string }> = {
  draft: { variant: 'secondary', className: '', label: 'Borrador' },
  pending_review: { variant: 'outline', className: 'border-yellow-400 text-yellow-700 bg-yellow-50', label: 'Pendiente revisión' },
  pending_approval: { variant: 'outline', className: 'border-yellow-400 text-yellow-700 bg-yellow-50', label: 'Pendiente' },
  changes_requested: { variant: 'outline', className: 'border-orange-400 text-orange-700 bg-orange-50', label: 'Cambios solicitados' },
  max_rounds_reached: { variant: 'outline', className: 'border-red-400 text-red-700 bg-red-50', label: 'Límite alcanzado' },
  approved: { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600', label: 'Aprobado' },
  scheduled: { variant: 'default', className: 'bg-purple-500 hover:bg-purple-600', label: 'Programado' },
  published: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', label: 'Publicado' },
  rejected: { variant: 'destructive', className: '', label: 'Rechazado' },
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-800',
  facebook: 'bg-blue-100 text-blue-800',
  twitter: 'bg-sky-100 text-sky-800',
  tiktok: 'bg-gray-100 text-gray-800',
  linkedin: 'bg-indigo-100 text-indigo-800',
}

interface ClientOption { id: string; fullName: string }

function RoundsBadge({ used, max }: { used: number; max: number }) {
  const remaining = max - used
  if (remaining <= 0) return <span className="text-xs font-medium text-red-600">Límite</span>
  const color = remaining === 1 ? 'text-orange-600' : 'text-muted-foreground'
  return <span className={`text-xs font-mono ${color}`}>{used}/{max}</span>
}

function PostsTable({ posts, onApprove, onReject, onSendForReview }: {
  posts: SocialPost[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onSendForReview: (id: string) => void
}) {
  if (posts.length === 0) {
    return <div className="text-center text-muted-foreground py-10 text-sm">No se encontraron publicaciones</div>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Plataformas</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Rondas</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => {
          const badgeConfig = statusBadgeMap[post.status] ?? { variant: 'secondary' as const, className: '', label: post.status }
          return (
            <TableRow key={post.id}>
              <TableCell>
                <Badge variant={post.type === 'story' ? 'default' : 'secondary'} className={`text-xs ${post.type === 'story' ? 'bg-pink-500 hover:bg-pink-600' : ''}`}>
                  {post.type === 'story' ? '📱 Story' : '🖼 Post'}
                </Badge>
              </TableCell>
              <TableCell className="font-medium text-sm">{post.clientName}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {post.mediaUrls.length > 0 && (
                    <img src={post.mediaUrls[0]} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                  )}
                  <span className="text-sm">{post.title || post.content.slice(0, 40) + '...'}</span>
                  {post.notes?.startsWith('ESCALADO') && (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {post.platforms.map((p) => (
                    <span key={p} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${platformColors[p] ?? ''}`}>{p}</span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {post.scheduledDate ? `${post.scheduledDate} ${post.scheduledTime ?? ''}` : '-'}
              </TableCell>
              <TableCell>
                <RoundsBadge used={post.changeRounds} max={post.maxRounds} />
              </TableCell>
              <TableCell>
                <Badge variant={badgeConfig.variant} className={badgeConfig.className}>{badgeConfig.label}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                  {post.status === 'draft' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600 hover:text-yellow-700" title="Enviar a revisión" onClick={() => onSendForReview(post.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {['pending_review', 'pending_approval', 'changes_requested', 'max_rounds_reached'].includes(post.status) && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" title="Aprobar" onClick={() => onApprove(post.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" title="Rechazar" onClick={() => onReject(post.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default function PostsListPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')

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
          canvaDesignId: p.canva_design_id ?? undefined, approvedBy: p.approved_by ?? undefined,
          notes: p.notes ?? undefined, createdBy: p.created_by,
          createdAt: p.created_at, updatedAt: p.updated_at,
        }))
      )
    }
    load()
  }, [])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterClient !== 'all' && post.clientId !== filterClient) return false
      if (filterStatus !== 'all' && post.status !== filterStatus) return false
      if (filterPlatform !== 'all' && !post.platforms.includes(filterPlatform as Platform)) return false
      return true
    })
  }, [posts, filterClient, filterStatus, filterPlatform])

  const updateStatus = async (postId: string, status: PostStatus) => {
    const supabase = createClient()
    const finalStatus = status === 'approved' ? 'scheduled' : status
    const { error } = await supabase.from('posts').update({ status: finalStatus, updated_at: new Date().toISOString() }).eq('id', postId)
    if (error) { toast.error('Error al actualizar'); return }
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: finalStatus } : p))
    toast.success(finalStatus === 'scheduled' ? 'Post aprobado y agendado' : 'Post rechazado')
  }

  const sendForReview = async (postId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('posts').update({ status: 'pending_review', updated_at: new Date().toISOString() }).eq('id', postId)
    if (error) { toast.error('Error'); return }
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: 'pending_review' as PostStatus } : p))
    toast.success('Post enviado a revisión del cliente')
  }

  const allPosts = filteredPosts
  const pending = filteredPosts.filter((p) => ['pending_review', 'pending_approval', 'changes_requested', 'max_rounds_reached'].includes(p.status))
  const escalated = filteredPosts.filter((p) => p.notes?.startsWith('ESCALADO'))
  const stories = filteredPosts.filter((p) => p.type === 'story')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Publicaciones</h2>
        <p className="text-muted-foreground">Gestiona todas las publicaciones de redes sociales</p>
      </div>

      {escalated.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong>{escalated.length}</strong> publicación(es) escalada(s) requieren intervención del admin</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusBadgeMap).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Plataforma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin'].map((p) => (
              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({allPosts.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes {pending.length > 0 && <span className="ml-1 rounded-full bg-yellow-500 text-white text-xs px-1.5">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
          {escalated.length > 0 && (
            <TabsTrigger value="escalated">
              Escalados <span className="ml-1 rounded-full bg-red-500 text-white text-xs px-1.5">{escalated.length}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all">
          <Card><CardContent className="p-0">
            <PostsTable posts={allPosts} onApprove={(id) => updateStatus(id, 'approved')} onReject={(id) => updateStatus(id, 'rejected')} onSendForReview={sendForReview} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card><CardContent className="p-0">
            <PostsTable posts={pending} onApprove={(id) => updateStatus(id, 'approved')} onReject={(id) => updateStatus(id, 'rejected')} onSendForReview={sendForReview} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="stories">
          <Card><CardContent className="p-0">
            <PostsTable posts={stories} onApprove={(id) => updateStatus(id, 'approved')} onReject={(id) => updateStatus(id, 'rejected')} onSendForReview={sendForReview} />
          </CardContent></Card>
        </TabsContent>

        {escalated.length > 0 && (
          <TabsContent value="escalated">
            <Card><CardContent className="p-0">
              <PostsTable posts={escalated} onApprove={(id) => updateStatus(id, 'approved')} onReject={(id) => updateStatus(id, 'rejected')} onSendForReview={sendForReview} />
            </CardContent></Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
