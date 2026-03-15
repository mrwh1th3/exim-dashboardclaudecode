'use client'

import { useAuthStore } from '@/stores/auth-store'
import { mockPlans, mockClientSubscriptions } from '@/data/mock-subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, MessageCircle, AlertCircle } from 'lucide-react'

export default function ClientSubscriptionPage() {
  const { user } = useAuthStore()

  const subscription = mockClientSubscriptions.find((s) => s.clientId === user?.id)
  const plan = subscription ? mockPlans.find((p) => p.id === subscription.planId) : null

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

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Suscripción</h2>
        <p className="text-muted-foreground">Detalles de tu plan actual</p>
      </div>

      <Card>
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
            <span className="text-4xl font-bold">${plan.price.toLocaleString()}</span>
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

          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast.info('Mensaje enviado al equipo de soporte')}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Contactar soporte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
