'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { mockClients } from '@/data/mock-clients'
import { mockClientSubscriptions, mockPlans } from '@/data/mock-subscriptions'
import { mockClientFlows } from '@/data/mock-flows'
import { mockFlowTemplates } from '@/data/mock-flows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ClientsListPage() {
  const [search, setSearch] = useState('')

  const filteredClients = mockClients.filter((client) => {
    const q = search.toLowerCase()
    return (
      client.fullName.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.companyName?.toLowerCase().includes(q) ?? false)
    )
  })

  const getServiceType = (clientId: string) => {
    const flow = mockClientFlows.find((f) => f.clientId === clientId)
    if (!flow) return 'Sin servicio'
    const template = mockFlowTemplates.find((t) => t.id === flow.flowTemplateId)
    if (!template) return 'Sin servicio'
    return template.type === 'web' ? 'Web' : 'Redes Sociales'
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
                    <Badge variant="outline">{getServiceType(client.id)}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.isActive ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver detalle
                      </Button>
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
