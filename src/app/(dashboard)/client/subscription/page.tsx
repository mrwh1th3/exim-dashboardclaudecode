'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { mockPlans, mockClientSubscriptions, mockInvoices } from '@/data/mock-subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Check, MessageCircle, AlertCircle, ArrowRightLeft, XCircle } from 'lucide-react'
import { BorderBeam } from '@/components/ui/border-beam'
import { NumberTicker } from '@/components/ui/number-ticker'

export default function ClientSubscriptionPage() {
  const { user } = useAuthStore()
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const subscription = mockClientSubscriptions.find((s) => s.clientId === user?.id)
  const plan = subscription ? mockPlans.find((p) => p.id === subscription.planId) : null
  const clientInvoices = mockInvoices.filter((inv) => inv.clientId === user?.id)

  if (!subscription || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No tienes una suscripción activa</h2>
        <p className="text-muted-foreground mb-4">Contacta a soporte para adquirir un plan.</p>
        <Button onClick={() => toast.info('Mensaje enviado al equipo de soporte')}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Contactar soporte
        </Button>
      </div>
    )
  }

  const periodStart = subscription.currentPeriodStart
    ? new Date(subscription.currentPeriodStart).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  const handleChangePlan = (planId: string) => {
    const selectedPlan = mockPlans.find((p) => p.id === planId)
    toast.success(`Solicitud de cambio a plan "${selectedPlan?.name}" enviada`)
    setChangePlanOpen(false)
  }

  const handleCancelSubscription = () => {
    toast.success('Solicitud de cancelación enviada. Nos pondremos en contacto contigo.')
    setCancelOpen(false)
    setCancelReason('')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Suscripción</h2>
        <p className="text-muted-foreground">Detalles de tu plan actual</p>
      </div>

      {/* Current Plan Card */}
      <Card className="relative overflow-hidden">
        <BorderBeam colorFrom="#d86226" colorTo="#7e230c" duration={8} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              {plan.description && <CardDescription>{plan.description}</CardDescription>}
            </div>
            <Badge
              variant="default"
              className={
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-red-100 text-red-800 hover:bg-red-100'
              }
            >
              {subscription.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <span className="text-4xl font-bold">$<NumberTicker value={plan.price} /></span>
            <span className="text-muted-foreground ml-1">MXN/mes</span>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Características incluidas</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm">
              <span className="font-medium">Periodo actual: </span>
              {periodStart} - {periodEnd}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Historial de Facturación</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay facturas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  clientInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">
                        {new Date(inv.createdAt).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.periodStart).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                        {' - '}
                        {new Date(inv.periodEnd).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        ${inv.amount.toLocaleString()} MXN
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            inv.status === 'paid'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : inv.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {inv.status === 'paid' ? 'Pagado' : inv.status === 'pending' ? 'Pendiente' : 'Fallido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Manage Subscription */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Gestionar Suscripción</h3>
        <div className="flex flex-wrap gap-3">
          {/* Change Plan Dialog */}
          <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Cambiar Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cambiar Plan</DialogTitle>
                <DialogDescription>Selecciona el plan al que deseas cambiar</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2 py-4">
                {mockPlans.filter((p) => p.isActive).map((p) => (
                  <Card
                    key={p.id}
                    className={p.id === plan.id ? 'border-primary ring-2 ring-primary/20' : ''}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        {p.id === plan.id && (
                          <Badge variant="default" className="text-xs">Plan actual</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3">
                        <span className="text-2xl font-bold">${p.price.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm ml-1">MXN/mes</span>
                      </div>
                      <ul className="space-y-1 mb-4">
                        {p.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs">
                            <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {p.features.length > 4 && (
                          <li className="text-xs text-muted-foreground">
                            +{p.features.length - 4} más...
                          </li>
                        )}
                      </ul>
                      <Button
                        variant={p.id === plan.id ? 'secondary' : 'default'}
                        size="sm"
                        className="w-full"
                        disabled={p.id === plan.id}
                        onClick={() => handleChangePlan(p.id)}
                      >
                        {p.id === plan.id ? 'Plan actual' : 'Seleccionar'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Cancel Subscription Dialog */}
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Suscripción
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancelar Suscripción</DialogTitle>
                <DialogDescription>
                  Esta acción cancelará tu suscripción al final del período actual. Perderás acceso a todas las funcionalidades de tu plan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                  <strong>Advertencia:</strong> Al cancelar tu suscripción, tu sitio web y servicios asociados dejarán de estar disponibles al finalizar el período de facturación actual ({periodEnd}).
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Motivo de cancelación (opcional)</Label>
                  <Textarea
                    id="cancel-reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Cuéntanos por qué deseas cancelar..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelOpen(false)}>
                  Mantener suscripción
                </Button>
                <Button variant="destructive" onClick={handleCancelSubscription}>
                  Confirmar cancelación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
