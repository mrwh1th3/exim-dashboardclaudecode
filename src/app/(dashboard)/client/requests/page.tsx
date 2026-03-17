'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ClientRequestsPage() {
  const user = useAuthStore((state) => state.user)
  const [requests, setRequests] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('requests')
        .select('*, request_statuses(id, name, color)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(data ?? [])
    })()
  }, [user?.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Solicitudes</h1>
          <p className="text-muted-foreground">Historial de tus solicitudes y cambios</p>
        </div>
        <Link href="/client/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título / Sección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Urgencia</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const status = req.request_statuses
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {req.type === 'page_change' ? 'Cambio' : 'Producto'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {req.type === 'page_change' ? req.page_section : req.product_title}
                      </TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: status?.color, color: '#fff' }}>
                          {status?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.urgency === 'urgent' ? (
                          <Badge variant="destructive">Urgente</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString('es-MX')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tienes solicitudes aún. Crea tu primera solicitud.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
