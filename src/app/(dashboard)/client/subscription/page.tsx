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
import { Check, MessageCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { BorderBeam } from '@/components/ui/border-beam'
import { NumberTicker } from '@/components/ui/number-ticker'

interface Sub { id: string; planId: string; status: string; currentPeriodStart?: string; currentPeriodEnd?: string }
interface Invoice { id: string; amount: number; currency: string; status: string; periodStart: string; periodEnd: string; paidAt?: string; createdAt: string }

export function ClientSubscriptionSection() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Sub | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const supabase = createClient()
      const [{ data: subData }, { data: plansData }, { data: invoicesData }] = await Promise.all([
        supabase.from('client_subscriptions').select('*').eq('client_id', user!.id).eq('status', 'active').maybeSingle(),
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('price'),
        supabase.from('invoices').select('*').eq('client_id', user!.id).order('created_at', { ascending: false }),
      ])
      const mappedPlans: SubscriptionPlan[] = (plansData ?? []).map((p: any) => ({
        id: p.id, name: p.name, description: p.description ?? undefined,
        price: p.price, currency: p.currency, interval: p.interval,
        features: p.features ?? [], isActive: p.is_active,
        stripePriceId: p.stripe_price_id ?? undefined, createdAt: p.created_at,
      }))
      if (subData) {
        const sub: Sub = {
          id: subData.id, planId: subData.plan_id, status: subData.status,
          currentPeriodStart: subData.current_period_start ?? undefined,
          currentPeriodEnd: subData.current_period_end ?? undefined,
        }
        setSubscription(sub)
        setPlan(mappedPlans.find((p) => p.id === sub.planId) ?? null)
      }
      setInvoices(
        (invoicesData ?? []).map((inv: any) => ({
          id: inv.id, amount: inv.amount, currency: inv.currency, status: inv.status,
          periodStart: inv.period_start, periodEnd: inv.period_end,
          paidAt: inv.paid_at ?? undefined, createdAt: inv.created_at,
        }))
      )
    }
    load()
  }, [user?.id])

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
    ? new Date(subscription.currentPeriodStart).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-'
  const periodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-'

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Suscripción</h2>
        <p className="text-muted-foreground">Detalles de tu plan actual</p>
      </div>

      <Card className="relative overflow-hidden">
        <BorderBeam colorFrom="#d86226" colorTo="#7e230c" duration={8} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              {plan.description && <CardDescription>{plan.description}</CardDescription>}
            </div>
            <Badge variant="default" className={subscription.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
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
            <p className="text-sm"><span className="font-medium">Periodo actual: </span>{periodStart} - {periodEnd}</p>
          </div>
        </CardContent>
      </Card>

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
                {invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No hay facturas registradas</TableCell></TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">{new Date(inv.createdAt).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.periodStart).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                        {' - '}
                        {new Date(inv.periodEnd).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">${inv.amount.toLocaleString()} MXN</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={inv.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}>
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

      <div>
        <h3 className="text-lg font-semibold mb-3">Gestionar Suscripción</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Para cambiar o cancelar tu plan, accede al portal de Stripe donde podrás gestionar todos los aspectos de tu suscripción.
        </p>
        <Button onClick={handleManageSubscription}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Gestionar Suscripción
        </Button>
      </div>
    </div>
  )
}

export default ClientSubscriptionSection
