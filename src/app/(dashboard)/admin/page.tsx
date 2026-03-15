'use client'

import { Users, MessageSquare, CreditCard, Calendar } from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { mockRequests, mockRequestStatuses } from '@/data/mock-requests'

const recentActivity = [
  { id: '1', clientName: 'Carlos Méndez', action: 'Envió solicitud de cambio de página', date: '2024-09-01' },
  { id: '2', clientName: 'Ana García', action: 'Agregó nuevo producto', date: '2024-09-05' },
  { id: '3', clientName: 'Roberto López', action: 'Completó etapa de onboarding', date: '2024-09-08' },
  { id: '4', clientName: 'Pedro Ramírez', action: 'Renovó suscripción', date: '2024-09-10' },
  { id: '5', clientName: 'Laura Hernández', action: 'Canceló suscripción', date: '2024-08-15' },
]

export default function AdminDashboardPage() {
  const recentRequests = mockRequests.slice(0, 3)

  const getStatusInfo = (statusId: string) => {
    return mockRequestStatuses.find((s) => s.id === statusId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clientes"
          value={5}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Solicitudes Pendientes"
          value={2}
          icon={<MessageSquare className="h-6 w-6" />}
        />
        <StatCard
          title="Suscripciones Activas"
          value={4}
          icon={<CreditCard className="h-6 w-6" />}
        />
        <StatCard
          title="Posts Programados"
          value={3}
          icon={<Calendar className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{item.clientName}</p>
                    <p className="text-xs text-muted-foreground">{item.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((req) => {
                  const status = getStatusInfo(req.statusId)
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {req.type === 'page_change' ? 'Cambio' : 'Producto'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{ backgroundColor: status?.color, color: '#fff' }}
                        >
                          {status?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString('es-MX')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
