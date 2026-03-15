'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Clock, Lock } from 'lucide-react'
import { mockClients } from '@/data/mock-clients'
import { mockClientFlows, mockFlowTemplates, mockFlowStages, mockClientStageProgress } from '@/data/mock-flows'
import { mockRequests, mockRequestStatuses } from '@/data/mock-requests'
import { mockClientSubscriptions, mockPlans } from '@/data/mock-subscriptions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = use(params)
  const client = mockClients.find((c) => c.id === clientId)

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold">Cliente no encontrado</h1>
        <p className="text-muted-foreground mt-2">El cliente solicitado no existe.</p>
        <Link href="/admin/clients">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a clientes
          </Button>
        </Link>
      </div>
    )
  }

  const clientFlow = mockClientFlows.find((f) => f.clientId === clientId)
  const flowTemplate = clientFlow
    ? mockFlowTemplates.find((t) => t.id === clientFlow.flowTemplateId)
    : null
  const flowStages = flowTemplate
    ? mockFlowStages.filter((s) => s.flowTemplateId === flowTemplate.id).sort((a, b) => a.orderIndex - b.orderIndex)
    : []
  const stageProgress = clientFlow
    ? mockClientStageProgress.filter((sp) => sp.clientFlowId === clientFlow.id)
    : []

  const clientRequests = mockRequests.filter((r) => r.clientId === clientId)
  const subscription = mockClientSubscriptions.find((s) => s.clientId === clientId)
  const plan = subscription ? mockPlans.find((p) => p.id === subscription.planId) : null

  const getStageStatusIcon = (stageId: string) => {
    const progress = stageProgress.find((sp) => sp.stageId === stageId)
    if (!progress) return <Circle className="h-5 w-5 text-muted-foreground" />
    switch (progress.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'locked':
        return <Lock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStageStatusLabel = (stageId: string) => {
    const progress = stageProgress.find((sp) => sp.stageId === stageId)
    if (!progress) return 'Sin iniciar'
    switch (progress.status) {
      case 'completed': return 'Completado'
      case 'in_progress': return 'En progreso'
      case 'locked': return 'Bloqueado'
      default: return 'Disponible'
    }
  }

  const getRequestStatus = (statusId: string) => {
    return mockRequestStatuses.find((s) => s.id === statusId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{client.fullName}</h1>
            {client.isActive ? (
              <Badge variant="outline" className="border-green-500 text-green-600">Activo</Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-600">Inactivo</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{client.companyName} &middot; {client.email}</p>
        </div>
      </div>

      <Tabs defaultValue="onboarding">
        <TabsList>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes</TabsTrigger>
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {flowTemplate ? flowTemplate.name : 'Sin flujo asignado'}
              </CardTitle>
              {clientFlow && (
                <Badge variant="outline" className="w-fit">
                  {clientFlow.status === 'completed'
                    ? 'Completado'
                    : clientFlow.status === 'in_progress'
                    ? 'En progreso'
                    : 'No iniciado'}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {flowStages.length > 0 ? (
                <div className="space-y-4">
                  {flowStages.map((stage, index) => (
                    <div key={stage.id} className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="mt-0.5">{getStageStatusIcon(stage.id)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">
                            Etapa {index + 1}: {stage.name}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {getStageStatusLabel(stage.id)}
                          </span>
                        </div>
                        {stage.description && (
                          <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay flujo de onboarding asignado a este cliente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {clientRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título / Sección</TableHead>
                      <TableHead>Urgencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientRequests.map((req) => {
                      const status = getRequestStatus(req.statusId)
                      return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {req.type === 'page_change' ? 'Cambio' : 'Producto'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {req.type === 'page_change' ? req.pageSection : req.productTitle}
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
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Este cliente no tiene solicitudes.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Suscripción</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription && plan ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="text-lg font-semibold">{plan.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Precio</p>
                      <p className="text-lg font-semibold">
                        ${plan.price} {plan.currency}/{plan.interval === 'monthly' ? 'mes' : 'año'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge
                        variant="outline"
                        className={
                          subscription.status === 'active'
                            ? 'border-green-500 text-green-600'
                            : subscription.status === 'cancelled'
                            ? 'border-red-500 text-red-600'
                            : 'border-yellow-500 text-yellow-600'
                        }
                      >
                        {subscription.status === 'active'
                          ? 'Activa'
                          : subscription.status === 'cancelled'
                          ? 'Cancelada'
                          : subscription.status === 'past_due'
                          ? 'Vencida'
                          : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Periodo actual</p>
                      <p className="text-sm">
                        {subscription.currentPeriodStart
                          ? new Date(subscription.currentPeriodStart).toLocaleDateString('es-MX')
                          : '-'}{' '}
                        -{' '}
                        {subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {plan.features.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Características del plan</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Este cliente no tiene una suscripción activa.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
