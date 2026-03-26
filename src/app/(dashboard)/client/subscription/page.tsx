'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { SubscriptionPlan } from '@/types/subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Check, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { BorderBeam } from '@/components/ui/border-beam'
import { NumberTicker } from '@/components/ui/number-ticker'

interface Sub {
  id: string
  planId: string
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  periodStart: string
  periodEnd: string
  paidAt?: string
  createdAt: string
}

export function ClientSubscriptionSection() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const supabase = createClient()
      const [{ data: subsData }, { data: plansData }, { data: invoicesData }] = await Promise.all([
        supabase
          .from('client_subscriptions')
          .select('*')
          .eq('client_id', user!.id)
          .in('status', ['active', 'pending']),
        supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price'),
        supabase
          .from('invoices')
          .select('*')
          .eq('client_id', user!.id)
          .order('created_at', { ascending: false }),
      ])

      setSubscriptions(
        (subsData ?? []).map((s: any) => ({
          id: s.id,
          planId: s.plan_id,
          status: s.status,
          currentPeriodStart: s.current_period_start ?? undefined,
          currentPeriodEnd: s.current_period_end ?? undefined,
        }))
      )

      setPlans(
        (plansData ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? undefined,
          price: p.price,
          currency: p.currency,
          interval: p.interval,
          features: p.features ?? [],
          isActive: p.is_active,
          stripePriceId: p.stripe_price_id ?? undefined,
          createdAt: p.created_at,
        }))
      )

      setInvoices(
        (invoicesData ?? []).map((inv: any) => ({
          id: inv.id,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          periodStart: inv.period_start,
          periodEnd: inv.period_end,
          paidAt: inv.paid_at ?? undefined,
          createdAt: inv.created_at,
        }))
      )
      setLoading(false)
    }
    load()
  }, [user?.id])

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const subscribedPlanIds = activeSubscriptions.map((s) => s.planId)
  const availablePlans = plans.filter((p) => !subscribedPlanIds.includes(p.id))

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, clientId: user?.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.url) {
        router.push(data.url)
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Error al iniciar el pago')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: user?.id }),
    })
    const { url } = await res.json()
    if (url) router.push(url)
    else toast.error('No se pudo abrir el portal de Stripe. Contacta a soporte.')
  }

  const getPlanById = (planId: string) => plans.find((p) => p.id === planId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Suscripción</h2>
        <p className="text-muted-foreground">
          {activeSubscriptions.length > 0
            ? 'Gestiona tus planes activos'
            : 'Escoge un plan para comenzar'}
        </p>
      </div>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Planes Activos</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeSubscriptions.map((sub) => {
              const plan = getPlanById(sub.planId)
              if (!plan) return null
              const periodStart = sub.currentPeriodStart
                ? new Date(sub.currentPeriodStart).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'
              const periodEnd = sub.currentPeriodEnd
                ? new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'

              return (
                <Card key={sub.id} className="relative overflow-hidden">
                  <BorderBeam colorFrom="#d86226" colorTo="#7e230c" duration={8} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Activo
                      </Badge>
                    </div>
                    {plan.description && <CardDescription>{plan.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">
                        $<NumberTicker value={plan.price} />
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {plan.currency}/{plan.interval === 'monthly' ? 'mes' : 'año'}
                      </span>
                    </div>
                    {plan.features.length > 0 && (
                      <ul className="space-y-1.5">
                        {plan.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-sm text-muted-foreground">
                            +{plan.features.length - 4} más...
                          </li>
                        )}
                      </ul>
                    )}
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <span className="font-medium">Periodo: </span>
                      {periodStart} - {periodEnd}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Button onClick={handleManageSubscription} variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Gestionar en Stripe
          </Button>
        </div>
      )}

      {/* Available Plans */}
      {availablePlans.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {activeSubscriptions.length > 0 ? 'Agregar otro plan' : 'Planes Disponibles'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un plan y procede al pago seguro con Stripe
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card
                key={plan.id}
                className="relative hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && <CardDescription>{plan.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">${plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1 text-sm">
                      {plan.currency}/{plan.interval === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </div>
                  {plan.features.length > 0 && (
                    <ul className="space-y-1.5">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(plan.id)}
                    disabled={checkoutLoading === plan.id}
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Suscribirse'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No plans available message */}
      {plans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay planes disponibles</h3>
            <p className="text-muted-foreground">
              Contacta a soporte para más información sobre nuestros servicios.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      {invoices.length > 0 && (
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
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">
                        {new Date(inv.createdAt).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.periodStart).toLocaleDateString('es-MX', {
                          month: 'short',
                          year: 'numeric',
                        })}
                        {' - '}
                        {new Date(inv.periodEnd).toLocaleDateString('es-MX', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        ${inv.amount.toLocaleString()} {inv.currency}
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
                          {inv.status === 'paid'
                            ? 'Pagado'
                            : inv.status === 'pending'
                            ? 'Pendiente'
                            : 'Fallido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ClientSubscriptionSection
