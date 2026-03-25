'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface ClientRow {
  id: string
  email: string
  fullName: string
  companyName?: string
  isActive: boolean
  serviceType?: string
}

export default function ClientsListPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [search, setSearch] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: profiles }, { data: flows }, { data: templates }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, company_name, is_active').eq('role', 'client').order('full_name'),
        supabase.from('client_flows').select('client_id, flow_template_id'),
        supabase.from('flow_templates').select('id, type'),
      ])
      const flowMap = new Map((flows ?? []).map((f: any) => [f.client_id, f.flow_template_id]))
      const templateMap = new Map((templates ?? []).map((t: any) => [t.id, t.type]))
      setClients(
        (profiles ?? []).map((p: any) => {
          const flowTemplateId = flowMap.get(p.id)
          const templateType = flowTemplateId ? templateMap.get(flowTemplateId) : undefined
          const serviceType = templateType === 'web' ? 'Web' : templateType === 'social' ? 'Redes Sociales' : undefined
          return {
            id: p.id,
            email: p.email,
            fullName: p.full_name ?? '',
            companyName: p.company_name ?? undefined,
            isActive: p.is_active ?? true,
            serviceType,
          }
        })
      )
    }
    load()
  }, [])

  const filteredClients = clients.filter((client) => {
    const q = search.toLowerCase()
    return (
      client.fullName.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.companyName?.toLowerCase().includes(q) ?? false)
    )
  })

  async function handleDeleteClient() {
    if (!clientToDelete) return
    const supabase = createClient()
    const { error } = await supabase.from('profiles').delete().eq('id', clientToDelete)
    if (error) { toast.error('Error al eliminar el cliente'); return }
    setClients((prev) => prev.filter(c => c.id !== clientToDelete))
    setClientToDelete(null)
    setDeleteDialogOpen(false)
    toast.success('Cliente eliminado')
  }

  function openEditClient(client: ClientRow) {
    setEditingClient(client)
    setEditName(client.fullName)
    setEditCompany(client.companyName || '')
    setEditDialogOpen(true)
  }

  async function handleUpdateClient() {
    if (!editingClient || !editName.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim(), company_name: editCompany.trim() || null })
      .eq('id', editingClient.id)

    if (error) { toast.error('Error al actualizar el cliente'); return }
    setClients((prev) => prev.map(c => c.id === editingClient.id ? { ...c, fullName: editName.trim(), companyName: editCompany.trim() || undefined } : c))
    setEditDialogOpen(false)
    setEditingClient(null)
    toast.success('Cliente actualizado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona todos tus clientes</p>
        </div>
        <Link href="/admin/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, empresa o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/admin/clients/${client.id}`} className="font-medium hover:underline">
                      {client.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{client.companyName ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{client.serviceType ?? 'Sin servicio'}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.isActive ? (
                      <Badge variant="outline" className="border-green-500/40 bg-green-500/10 text-green-400">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditClient(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setClientToDelete(client.id); setDeleteDialogOpen(true) }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Delete Client */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              Esta acción eliminará al cliente y todos sus datos asociados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteClient}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Client */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifica la información general de este cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresa (Opcional)</Label>
              <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateClient}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
