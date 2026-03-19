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
  RefreshCw, FileText, Loader2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface LocalPlan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  interval: string
  stripePriceId: string | null
}
interface Sub {
  id: string
  clientId: string
  planId: string
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
}
interface Invoice {
  id: string
  clientId: string
  amount: number
  status: string
  periodStart: string
  periodEnd: string
  paidAt?: string
  createdAt: string
}
interface ClientOption { id: string; fullName: string }

function intervalLabel(interval: string) {
  if (interval === 'monthly') return '/mes'
  if (interval === 'yearly') return '/año'
  return `/${interval}`
}

export default function SubscriptionsPage() {
  const [localPlans, setLocalPlans] = useState<LocalPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: plansData }, { data: subsData }, { data: invData }, { data: clientsData }] =
      await Promise.all([
        supabase
          .from('subscription_plans')
          .select('id, name, description, price, currency, interval, stripe_price_id')
          .order('price'),
        supabase
          .from('client_subscriptions')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'client')
          .order('full_name'),
      ])

    setLocalPlans(
      (plansData ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        price: p.price,
        currency: p.currency ?? 'MXN',
        interval: p.interval ?? 'monthly',
        stripePriceId: p.stripe_price_id ?? null,
      })),
    )
    setClients((clientsData ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
    setSubscriptions(
      (subsData ?? []).map((s: any) => ({
        id: s.id,
        clientId: s.client_id,
        planId: s.plan_id,
        status: s.status,
        currentPeriodStart: s.current_period_start ?? undefined,
        currentPeriodEnd: s.current_period_end ?? undefined,
      })),
    )
    setInvoices(
      (invData ?? []).map((inv: any) => ({
        id: inv.id,
        clientId: inv.client_id,
        amount: inv.amount,
        status: inv.status,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        paidAt: inv.paid_at ?? undefined,
        createdAt: inv.created_at,
      })),
    )
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/stripe/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadData()
      toast.success(
        `Sincronización completada · ${data.plansUpserted} planes · ${data.subsUpserted} suscripciones`,
      )
    } catch (err: any) {
      toast.error(err.message ?? 'Error al sincronizar con Stripe')
    } finally {
      setSyncing(false)
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
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.fullName ?? clientId
  const getPlanName = (planId: string) =>
    localPlans.find((p) => p.id === planId)?.name ?? planId
  const clientInvoices = selectedClientId
    ? invoices.filter((inv) => inv.clientId === selectedClientId)
    : []

  const toggleSubscriptionStatus = async (subId: string) => {
    const sub = subscriptions.find((s) => s.id === subId)
    if (!sub) return
    const newStatus = sub.status === 'active' ? 'inactive' : 'active'
    const supabase = createClient()
    await supabase.from('client_subscriptions').update({ status: newStatus }).eq('id', subId)
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: newStatus } : s)),
    )
    toast.success('Estado de suscripción actualizado')
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ingresos del Mes"
          value={`$${mrr.toLocaleString()} MXN`}
          icon={<DollarSign size={24} />}
          description="MRR actual"
        />
        <StatCard
          title="Suscripciones Activas"
          value={activeSubscriptions.length}
          icon={<Users size={24} />}
          description={`de ${subscriptions.length} totales`}
        />
        <StatCard
          title="Ingresos Totales"
          value={`$${totalRevenue.toLocaleString()} MXN`}
          icon={<TrendingUp size={24} />}
          description="Acumulado"
        />
        <StatCard
          title="Planes Sincronizados"
          value={localPlans.length}
          icon={<RefreshCw size={24} />}
          description="desde Stripe"
        />
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
                <RechartsTooltip
                  formatter={(value) => [`$${Number(value).toLocaleString()} MXN`, 'Ingresos']}
                />
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
              <p className="text-muted-foreground">
                Planes sincronizados desde Stripe · {localPlans.length} activos
              </p>
            </div>
            <div className="flex gap-2">
              <Button disabled={syncing} onClick={handleSync}>
                {syncing
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <RefreshCw className="mr-2 h-4 w-4" />
                }
                {syncing ? 'Sincronizando...' : 'Sincronizar con Stripe'}
              </Button>
              <a
                href="https://dashboard.stripe.com/products"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[15px] border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4" />Gestionar en Stripe
              </a>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-36 animate-pulse opacity-50" />
              ))}
            </div>
          ) : localPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
                <RefreshCw className="h-8 w-8 opacity-30" />
                <p className="text-sm">No hay planes sincronizados todavía.</p>
                <Button disabled={syncing} onClick={handleSync}>
                  {syncing
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <RefreshCw className="mr-2 h-4 w-4" />
                  }
                  Sincronizar con Stripe
                </Button>
                <p className="text-xs text-center max-w-xs">
                  Asegúrate de haber configurado{' '}
                  <code className="bg-muted px-1 py-0.5 rounded text-[11px]">STRIPE_SECRET_KEY</code>{' '}
                  en las variables de entorno de Vercel.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {localPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        Activo
                      </Badge>
                    </div>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-3xl font-bold">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-1 text-sm">
                        {plan.currency}{intervalLabel(plan.interval)}
                      </span>
                    </div>
                    {plan.stripePriceId && (
                      <a
                        href={`https://dashboard.stripe.com/prices/${plan.stripePriceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1 rounded-[15px] border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <ExternalLink className="h-3 w-3" />Ver en Stripe
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
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
            <Button disabled={syncing} onClick={handleSync}>
              {syncing
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <RefreshCw className="mr-2 h-4 w-4" />
              }
              {syncing ? 'Sincronizando...' : 'Sincronizar con Stripe'}
            </Button>
          </div>

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
                <p className="text-sm">No hay suscripciones registradas.</p>
                <p className="text-xs">
                  Usa &quot;Sincronizar con Stripe&quot; para importar suscriptores activos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="px-0 pt-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => {
                      const clientInvs = invoices.filter((inv) => inv.clientId === sub.clientId)
                      const lastPaid = clientInvs.find((inv) => inv.status === 'paid')
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">
                            {getClientName(sub.clientId)}
                          </TableCell>
                          <TableCell>{getPlanName(sub.planId)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={sub.status === 'active' ? 'default' : 'destructive'}
                              className={
                                sub.status === 'active'
                                  ? 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20'
                                  : sub.status === 'cancelled'
                                  ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              }
                            >
                              {sub.status === 'active'
                                ? 'Activo'
                                : sub.status === 'cancelled'
                                ? 'Cancelado'
                                : sub.status === 'inactive'
                                ? 'Inactivo'
                                : 'Pago vencido'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.currentPeriodStart && sub.currentPeriodEnd
                              ? `${new Date(sub.currentPeriodStart).toLocaleDateString('es-MX')} - ${new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX')}`
                              : lastPaid?.paidAt
                              ? new Date(lastPaid.paidAt).toLocaleDateString('es-MX')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSubscriptionStatus(sub.id)}
                              >
                                {sub.status === 'active'
                                  ? <ToggleRight className="mr-1 h-4 w-4 text-green-600" />
                                  : <ToggleLeft className="mr-1 h-4 w-4 text-muted-foreground" />
                                }
                                {sub.status === 'active' ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedClientId(sub.clientId)
                                  setInvoiceSheetOpen(true)
                                }}
                              >
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
            <SheetTitle>
              Facturas - {selectedClientId ? getClientName(selectedClientId) : ''}
            </SheetTitle>
            <SheetDescription>Historial de facturación del cliente</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
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
                {clientInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm">
                      {new Date(inv.createdAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.periodStart).toLocaleDateString('es-MX', {
                        month: 'short',
                        year: 'numeric',
                      })}
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
                        {inv.status === 'paid'
                          ? 'Pagado'
                          : inv.status === 'pending'
                          ? 'Pendiente'
                          : 'Fallido'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {clientInvoices.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No hay facturas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
