'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatCard } from '@/components/shared/stat-card'
import { toast } from 'sonner'
import {
  ExternalLink, ToggleLeft, ToggleRight, DollarSign, Users, TrendingUp,
  ArrowUpRight, FileText, Check, Plus, Download, Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { ShineBorder } from '@/components/ui/shine-border'
import { NumberTicker } from '@/components/ui/number-ticker'

interface StripePlan {
  id: string
  name: string
  description: string | null
  prices: {
    id: string
    amount: number
    currency: string
    type: 'one_time' | 'recurring'
    interval: string | null
    intervalCount: number
  }[]
}

interface LocalPlan { id: string; name: string; price: number; stripePriceId?: string }
interface Sub { id: string; clientId: string; planId: string; status: string; currentPeriodStart?: string; currentPeriodEnd?: string }
interface Invoice { id: string; clientId: string; amount: number; status: string; periodStart: string; periodEnd: string; paidAt?: string; createdAt: string }
interface ClientOption { id: string; fullName: string }

function intervalLabel(interval: string | null, count: number) {
  if (!interval) return ''
  if (interval === 'month' && count === 1) return '/mes'
  if (interval === 'month' && count === 2) return '/2 meses'
  if (interval === 'week' && count === 2) return '/2 semanas'
  if (interval === 'week' && count === 1) return '/semana'
  if (interval === 'year' && count === 1) return '/año'
  return `/ ${count} ${interval}`
}

function defaultPrice(plan: StripePlan) {
  return (
    plan.prices.find((p) => p.type === 'recurring' && p.interval === 'month' && p.intervalCount === 1) ??
    plan.prices.find((p) => p.type === 'recurring') ??
    plan.prices[0]
  )
}

export default function SubscriptionsPage() {
  const [stripePlans, setStripePlans] = useState<StripePlan[]>([])
  const [localPlans, setLocalPlans] = useState<LocalPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Import plan state
  const [newPlanSheetOpen, setNewPlanSheetOpen] = useState(false)
  const [importingPriceId, setImportingPriceId] = useState<string | null>(null)
  const [importedPriceIds, setImportedPriceIds] = useState<Set<string>>(new Set())

  // Import subscriptions state
  const [importingSubscriptions, setImportingSubscriptions] = useState(false)

  const loadSupabaseData = async () => {
    const supabase = createClient()
    const [{ data: plansData }, { data: subsData }, { data: invData }, { data: clientsData }] = await Promise.all([
      supabase.from('subscription_plans').select('id, name, price, stripe_price_id').order('price'),
      supabase.from('client_subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
    ])
    setLocalPlans((plansData ?? []).map((p: any) => ({ id: p.id, name: p.name, price: p.price, stripePriceId: p.stripe_price_id })))
    setImportedPriceIds(new Set((plansData ?? []).map((p: any) => p.stripe_price_id).filter(Boolean)))
    setClients((clientsData ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
    setSubscriptions((subsData ?? []).map((s: any) => ({
      id: s.id, clientId: s.client_id, planId: s.plan_id, status: s.status,
      currentPeriodStart: s.current_period_start ?? undefined,
      currentPeriodEnd: s.current_period_end ?? undefined,
    })))
    setInvoices((invData ?? []).map((inv: any) => ({
      id: inv.id, clientId: inv.client_id, amount: inv.amount, status: inv.status,
      periodStart: inv.period_start, periodEnd: inv.period_end,
      paidAt: inv.paid_at ?? undefined, createdAt: inv.created_at,
    })))
  }

  useEffect(() => {
    loadSupabaseData()
    fetch('/api/stripe/plans')
      .then((r) => r.json())
      .then((d) => { if (d.plans) setStripePlans(d.plans) })
      .catch(() => toast.error('Error al cargar planes de Stripe'))
      .finally(() => setLoadingPlans(false))
  }, [])

  const handleImportPlan = async (plan: StripePlan, price: StripePlan['prices'][0]) => {
    setImportingPriceId(price.id)
    try {
      const res = await fetch('/api/stripe/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: price.id, name: plan.name, description: plan.description }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadSupabaseData()
      toast.success(`"${plan.name}" importado correctamente`)
    } catch (err: any) {
      toast.error(err.message ?? 'Error al importar plan')
    } finally {
      setImportingPriceId(null)
    }
  }

  const handleImportSubscriptions = async () => {
    setImportingSubscriptions(true)
    try {
      const res = await fetch('/api/stripe/import-subscriptions', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadSupabaseData()
      const msg = `${data.imported} suscripciones importadas`
      const detail = data.skipped > 0 ? ` · ${data.skipped} omitidas (sin plan importado o cliente no encontrado)` : ''
      toast.success(msg + detail)
    } catch (err: any) {
      toast.error(err.message ?? 'Error al importar suscripciones')
    } finally {
      setImportingSubscriptions(false)
    }
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const p = localPlans.find((pl) => pl.id === sub.planId)
    return sum + (p?.price ?? 0)
  }, 0)

  const revenueData = [
    { month: 'Oct', revenue: 0 }, { month: 'Nov', revenue: 0 }, { month: 'Dic', revenue: 0 },
    { month: 'Ene', revenue: 0 }, { month: 'Feb', revenue: 0 }, { month: 'Mar', revenue: mrr },
  ]
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.fullName ?? clientId
  const getPlanName = (planId: string) => localPlans.find((p) => p.id === planId)?.name ?? planId
  const clientInvoices = selectedClientId ? invoices.filter((inv) => inv.clientId === selectedClientId) : []

  const toggleSubscriptionStatus = async (subId: string) => {
    const sub = subscriptions.find((s) => s.id === subId)
    if (!sub) return
    const newStatus = sub.status === 'active' ? 'inactive' : 'active'
    const supabase = createClient()
    await supabase.from('client_subscriptions').update({ status: newStatus }).eq('id', subId)
    setSubscriptions((prev) => prev.map((s) => s.id === subId ? { ...s, status: newStatus } : s))
    toast.success('Estado de suscripción actualizado')
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ingresos del Mes" value={`$${mrr.toLocaleString()} MXN`} icon={<DollarSign size={24} />} description="MRR actual" />
        <StatCard title="Suscripciones Activas" value={activeSubscriptions.length} icon={<Users size={24} />} description={`de ${subscriptions.length} totales`} />
        <StatCard title="Ingresos Totales" value={`$${totalRevenue.toLocaleString()} MXN`} icon={<TrendingUp size={24} />} description="Acumulado" />
        <StatCard title="Planes en Stripe" value={stripePlans.length} icon={<ArrowUpRight size={24} />} description="planes activos" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos Mensuales</CardTitle>
          <CardDescription>Evolución de ingresos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <RechartsTooltip formatter={(value) => [`$${Number(value).toLocaleString()} MXN`, 'Ingresos']} />
                <Bar dataKey="revenue" fill="#d86226" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
        </TabsList>

        {/* ── Plans tab ── */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Planes</h2>
              <p className="text-muted-foreground">Planes activos sincronizados desde Stripe</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setNewPlanSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Nuevo Plan
              </Button>
              <Button variant="outline" asChild>
                <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />Gestionar en Stripe
                </a>
              </Button>
            </div>
          </div>

          {loadingPlans ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-48 animate-pulse opacity-50" />
              ))}
            </div>
          ) : stripePlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
                <p className="text-sm">No hay planes activos en Stripe.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />Crear plan en Stripe
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stripePlans.map((plan) => {
                const primary = defaultPrice(plan)
                const isPremium = primary ? primary.amount >= 1999 : false
                const allImported = plan.prices.every((p) => importedPriceIds.has(p.id))
                return (
                  <Card key={plan.id} className="relative overflow-hidden">
                    {isPremium && <ShineBorder shineColor={['#d86226', '#7e230c', '#f59e0b']} duration={10} borderWidth={2} />}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {allImported
                          ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs"><Check className="h-3 w-3 mr-1" />Importado</Badge>
                          : <Badge variant="default">Activo</Badge>
                        }
                      </div>
                      {plan.description && <CardDescription>{plan.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      {primary && (
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            $<NumberTicker value={primary.amount} />
                          </span>
                          <span className="text-muted-foreground ml-1">
                            {primary.currency}{intervalLabel(primary.interval, primary.intervalCount)}
                          </span>
                        </div>
                      )}
                      {plan.prices.length > 1 && (
                        <ul className="space-y-1 mb-4">
                          {plan.prices.filter((p) => p.id !== primary?.id).map((p) => (
                            <li key={p.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-3 w-3 text-green-500 shrink-0" />
                              ${p.amount.toLocaleString()} {p.currency}{intervalLabel(p.interval, p.intervalCount)}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a
                          href={`https://dashboard.stripe.com/products/${plan.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />Ver en Stripe
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Subscriptions tab ── */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Suscripciones de Clientes</h2>
              <p className="text-muted-foreground">Gestiona las suscripciones activas</p>
            </div>
            <Button variant="outline" disabled={importingSubscriptions} onClick={handleImportSubscriptions}>
              {importingSubscriptions
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Download className="mr-2 h-4 w-4" />
              }
              {importingSubscriptions ? 'Importando...' : 'Importar de Stripe'}
            </Button>
          </div>

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
                <p className="text-sm">No hay suscripciones registradas.</p>
                <p className="text-xs">Usa "Importar de Stripe" para sincronizar suscriptores activos.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead><TableHead>Plan</TableHead><TableHead>Estado</TableHead>
                      <TableHead>Periodo</TableHead><TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => {
                      const clientInvs = invoices.filter((inv) => inv.clientId === sub.clientId)
                      const lastPaid = clientInvs.find((inv) => inv.status === 'paid')
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{getClientName(sub.clientId)}</TableCell>
                          <TableCell>{getPlanName(sub.planId)}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'active' ? 'default' : 'destructive'} className={sub.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : sub.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}>
                              {sub.status === 'active' ? 'Activo' : sub.status === 'cancelled' ? 'Cancelado' : sub.status === 'inactive' ? 'Inactivo' : 'Pago vencido'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.currentPeriodStart && sub.currentPeriodEnd
                              ? `${new Date(sub.currentPeriodStart).toLocaleDateString('es-MX')} - ${new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX')}`
                              : lastPaid?.paidAt ? new Date(lastPaid.paidAt).toLocaleDateString('es-MX') : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => toggleSubscriptionStatus(sub.id)}>
                                {sub.status === 'active' ? <ToggleRight className="mr-1 h-4 w-4 text-green-600" /> : <ToggleLeft className="mr-1 h-4 w-4 text-muted-foreground" />}
                                {sub.status === 'active' ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedClientId(sub.clientId); setInvoiceSheetOpen(true) }}>
                                <FileText className="mr-1 h-4 w-4" />Ver Facturas
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Invoice sheet ── */}
      <Sheet open={invoiceSheetOpen} onOpenChange={setInvoiceSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Facturas - {selectedClientId ? getClientName(selectedClientId) : ''}</SheetTitle>
            <SheetDescription>Historial de facturación del cliente</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Fecha</TableHead><TableHead>Periodo</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {clientInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm">{new Date(inv.createdAt).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(inv.periodStart).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="text-sm font-medium">${inv.amount.toLocaleString()} MXN</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={inv.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}>
                        {inv.status === 'paid' ? 'Pagado' : inv.status === 'pending' ? 'Pendiente' : 'Fallido'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {clientInvoices.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No hay facturas registradas</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── New Plan sheet (Stripe import) ── */}
      <Sheet open={newPlanSheetOpen} onOpenChange={setNewPlanSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Importar Plan de Stripe</SheetTitle>
            <SheetDescription>
              Selecciona un precio de Stripe para añadirlo al catálogo local. Los planes importados pueden asignarse a clientes.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {loadingPlans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stripePlans.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">
                No hay productos en Stripe. Crea uno primero.
              </p>
            ) : (
              stripePlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="text-xs">{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {plan.prices.map((price) => {
                      const isImported = importedPriceIds.has(price.id)
                      const isLoading = importingPriceId === price.id
                      return (
                        <div
                          key={price.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span className="text-sm">
                            <span className="font-semibold">
                              ${price.amount.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {price.currency}{intervalLabel(price.interval, price.intervalCount)}
                            </span>
                            {price.type === 'one_time' && (
                              <span className="text-muted-foreground ml-1 text-xs">(pago único)</span>
                            )}
                          </span>

                          {isImported ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" />Importado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLoading || importingPriceId !== null}
                              onClick={() => handleImportPlan(plan, price)}
                            >
                              {isLoading
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Plus className="h-3 w-3 mr-1" />
                              }
                              Importar
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
