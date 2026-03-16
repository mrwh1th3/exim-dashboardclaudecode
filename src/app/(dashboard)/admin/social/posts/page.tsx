'use client'

import { useState, useMemo } from 'react'
import { mockPosts } from '@/data/mock-posts'
import { mockClients } from '@/data/mock-clients'
import { PostStatus, Platform } from '@/types/social'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Edit } from 'lucide-react'

const statusBadgeMap: Record<PostStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string; label: string }> = {
  draft: { variant: 'secondary', className: '', label: 'Borrador' },
  pending_approval: { variant: 'outline', className: 'border-yellow-400 text-yellow-700 bg-yellow-50', label: 'Pendiente' },
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

export default function PostsListPage() {
  const [posts, setPosts] = useState(mockPosts)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterClient !== 'all' && post.clientId !== filterClient) return false
      if (filterStatus !== 'all' && post.status !== filterStatus) return false
      if (filterPlatform !== 'all' && !post.platforms.includes(filterPlatform as Platform)) return false
      return true
    })
  }, [posts, filterClient, filterStatus, filterPlatform])

  const handleApprove = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'approved' as PostStatus, updatedAt: new Date().toISOString() } : p))
    )
    toast.success('Post aprobado')
  }

  const handleReject = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'rejected' as PostStatus, updatedAt: new Date().toISOString() } : p))
    )
    toast.success('Post rechazado')
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Publicaciones</h2>
        <p className="text-muted-foreground">Gestiona todas las publicaciones de redes sociales</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Cliente" />
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusBadgeMap).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Plataformas</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron publicaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => {
                  const badgeConfig = statusBadgeMap[post.status]
                  return (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.clientName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.mediaUrls.length > 0 && (
                            <img src={post.mediaUrls[0]} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                          )}
                          <span>{post.title || post.content.slice(0, 40) + '...'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {post.platforms.map((p) => (
                            <span
                              key={p}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${platformColors[p] ?? ''}`}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.scheduledDate
                          ? `${post.scheduledDate} ${post.scheduledTime ?? ''}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
                          {badgeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(post.status === 'pending_approval' || post.status === 'draft') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(post.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleReject(post.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
