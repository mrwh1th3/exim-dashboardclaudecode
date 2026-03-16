'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

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

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: profiles }, { data: flows }, { data: templates }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, company_name, is_active').eq('role', 'client').order('full_name'),
        supabase.from('client_flows').select('client_id, flow_template_id'),
        supabase.from('flow_templates').select('id, type'),
      ])
      const flowMap = new Map((flows ?? []).map((f) => [f.client_id, f.flow_template_id]))
      const templateMap = new Map((templates ?? []).map((t) => [t.id, t.type]))
      setClients(
        (profiles ?? []).map((p) => {
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
        <CardHeader>
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
                <TableHead>Acciones</TableHead>
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
                      <Badge variant="outline" className="border-green-500 text-green-600">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-600">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">Ver detalle</Button>
                    </Link>
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
    </div>
  )
}
