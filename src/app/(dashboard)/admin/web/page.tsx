'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WebPage, WebPageStatus } from '@/types/web-pages'
import { mockWebPages } from '@/data/mock-web-pages'
import { mockClients } from '@/data/mock-clients'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Globe } from 'lucide-react'

const statusConfig: Record<WebPageStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500' },
  in_development: { label: 'En desarrollo', color: 'bg-blue-500' },
  review: { label: 'En revisi\u00f3n', color: 'bg-yellow-500' },
  published: { label: 'Publicada', color: 'bg-green-500' },
  maintenance: { label: 'Mantenimiento', color: 'bg-orange-500' },
}

export default function AdminWebPagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<WebPage[]>(mockWebPages)
  const [newPageOpen, setNewPageOpen] = useState(false)
  const [newClientId, setNewClientId] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const handleCreatePage = () => {
    if (!newClientId || !newDomain.trim()) return
    const client = mockClients.find((c) => c.id === newClientId)
    const newPage: WebPage = {
      id: 'wp-' + Date.now(),
      clientId: newClientId,
      clientName: client?.companyName || client?.fullName || 'Cliente',
      domain: newDomain.trim(),
      url: newUrl.trim() || undefined,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPages((prev) => [...prev, newPage])
    setNewClientId('')
    setNewDomain('')
    setNewUrl('')
    setNewPageOpen(false)
    toast.success('P\u00e1gina web creada exitosamente')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">P\u00e1ginas Web</h1>
          <p className="text-muted-foreground">
            Administra todas las p\u00e1ginas web de tus clientes
          </p>
        </div>
        <Button onClick={() => setNewPageOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva P\u00e1gina
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Dominio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>\u00daltimo despliegue</TableHead>
              <TableHead>Creada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => {
              const status = statusConfig[page.status]
              return (
                <TableRow
                  key={page.id}
                  className="cursor-pointer"
                  onClick={() => router.push('/admin/web/' + page.id)}
                >
                  <TableCell className="font-medium">{page.clientName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {page.domain || '\u2014'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color + ' text-white hover:' + status.color}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.lastDeployedAt
                      ? new Date(page.lastDeployedAt).toLocaleDateString('es-MX')
                      : '\u2014'}
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

      {/* New Page Dialog */}
      <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva P\u00e1gina Web</DialogTitle>
            <DialogDescription>
              Crea una nueva p\u00e1gina web para un cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={newClientId} onValueChange={(val) => { if (val) setNewClientId(val) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-domain">Dominio</Label>
              <Input
                id="new-domain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-url">URL (opcional)</Label>
              <Input
                id="new-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://ejemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPageOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePage} disabled={!newClientId || !newDomain.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
