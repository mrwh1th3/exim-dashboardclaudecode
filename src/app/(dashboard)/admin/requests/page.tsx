'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Request, RequestStatus } from '@/types/requests'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [statuses, setStatuses] = useState<RequestStatus[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: reqs }, { data: sts }] = await Promise.all([
        supabase
          .from('requests')
          .select('*, profiles!requests_client_id_fkey(full_name), request_statuses(id, name, color)')
          .order('created_at', { ascending: false }),
        supabase.from('request_statuses').select('*').order('order_index'),
      ])
      setStatuses(
        (sts ?? []).map((s) => ({
          id: s.id, name: s.name, color: s.color,
          orderIndex: s.order_index, isDefault: s.is_default, createdAt: s.created_at,
        }))
      )
      setRequests(
        (reqs ?? []).map((r) => ({
          id: r.id,
          clientId: r.client_id,
          clientName: (r.profiles as { full_name: string } | null)?.full_name ?? '',
          type: r.type,
          statusId: r.status_id,
          status: r.request_statuses as RequestStatus,
          urgency: r.urgency ?? 'normal',
          pageSection: r.page_section ?? undefined,
          changeDescription: r.change_description ?? undefined,
          productTitle: r.product_title ?? undefined,
          productPrice: r.product_price ?? undefined,
          productCategory: r.product_category ?? undefined,
          productDescription: r.product_description ?? undefined,
          implementationDescription: r.implementation_description ?? undefined,
          adminNotes: r.admin_notes ?? undefined,
          assignedTo: r.assigned_to ?? undefined,
          attachments: [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }))
      )
    }
    load()
  }, [])

  const filteredRequests = requests.filter((req) => {
    if (typeFilter !== 'all' && req.type !== typeFilter) return false
    if (statusFilter !== 'all' && req.statusId !== statusFilter) return false
    return true
  })

  const getStatusInfo = (statusId: string) => statuses.find((s) => s.id === statusId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
        <p className="text-muted-foreground">Gestiona todas las solicitudes de los clientes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="page_change">Cambio de página</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título / Sección</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const status = getStatusInfo(req.statusId)
                return (
                  <TableRow key={req.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/admin/requests/${req.id}`} className="font-medium hover:underline">
                        {req.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {req.type === 'page_change' ? 'Cambio' : 'Producto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/requests/${req.id}`} className="hover:underline">
                        {req.type === 'page_change' ? req.pageSection : req.productTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {req.urgency === 'urgent' ? (
                        <Badge variant="destructive">Urgente</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: status?.color, color: '#fff' }}>
                        {status?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('es-MX')}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron solicitudes con los filtros seleccionados
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
