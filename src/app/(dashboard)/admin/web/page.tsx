'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WebPage, WebPageStatus } from '@/types/web-pages'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Globe } from 'lucide-react'

interface ClientOption { id: string; displayName: string }

const statusConfig: Record<WebPageStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500' },
  in_development: { label: 'En desarrollo', color: 'bg-blue-500' },
  review: { label: 'En revisión', color: 'bg-yellow-500' },
  published: { label: 'Publicada', color: 'bg-green-500' },
  maintenance: { label: 'Mantenimiento', color: 'bg-orange-500' },
}

export default function AdminWebPagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<WebPage[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [newClientId, setNewClientId] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: pagesData }, { data: clientsData }] = await Promise.all([
        supabase.from('web_pages').select('*, profiles!web_pages_client_id_fkey(full_name, company_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, company_name').eq('role', 'client').order('full_name'),
      ])
      setClients((clientsData ?? []).map((c: any) => ({
        id: c.id,
        displayName: c.company_name ?? c.full_name ?? '',
      })))
      setPages(
        (pagesData ?? []).map((p: any) => {
          const profile = p.profiles as { full_name: string; company_name: string } | null
          return {
            id: p.id,
            clientId: p.client_id,
            clientName: profile?.company_name ?? profile?.full_name ?? '',
            domain: p.domain ?? undefined,
            url: p.url ?? undefined,
            status: p.status as WebPageStatus,
            lastDeployedAt: p.last_deployed_at ?? undefined,
            sslExpiry: p.ssl_expiry ?? undefined,
            planId: p.plan_id ?? undefined,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }
        })
      )
    }
    load()
  }, [])

  const handleCreatePage = async () => {
    if (!newClientId || !newDomain.trim()) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('web_pages')
      .insert({
        client_id: newClientId,
        domain: newDomain.trim(),
        url: newUrl.trim() || null,
        status: 'draft',
      })
      .select('*, profiles!web_pages_client_id_fkey(full_name, company_name)')
      .single()
    if (error) { toast.error('Error al crear la página'); return }
    const profile = data.profiles as { full_name: string; company_name: string } | null
    setPages((prev) => [{
      id: data.id,
      clientId: data.client_id,
      clientName: profile?.company_name ?? profile?.full_name ?? '',
      domain: data.domain ?? undefined,
      url: data.url ?? undefined,
      status: data.status as WebPageStatus,
      lastDeployedAt: undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, ...prev])
    setNewClientId('')
    setNewDomain('')
    setNewUrl('')
    setNewPageOpen(false)
    toast.success('Página web creada exitosamente')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Páginas Web</h1>
          <p className="text-muted-foreground">Administra todas las páginas web de tus clientes</p>
        </div>
        <Button onClick={() => setNewPageOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Página
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Dominio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último despliegue</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => {
              const status = statusConfig[page.status]
              return (
                <TableRow key={page.id} className="cursor-pointer" onClick={() => router.push('/admin/web/' + page.id)}>
                  <TableCell className="font-medium">{page.clientName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {page.domain || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color + ' text-white hover:' + status.color}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.lastDeployedAt ? new Date(page.lastDeployedAt).toLocaleDateString('es-MX') : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(page.createdAt).toLocaleDateString('es-MX')}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={newPageOpen} onOpenChange={setNewPageOpen} disablePointerDismissal={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Página Web</DialogTitle>
            <DialogDescription>Crea una nueva página web para un cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={newClientId} onValueChange={(val) => { if (val) setNewClientId(val) }}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-domain">Dominio</Label>
              <Input id="new-domain" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-url">URL (opcional)</Label>
              <Input id="new-url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://ejemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPageOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePage} disabled={!newClientId || !newDomain.trim()}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
