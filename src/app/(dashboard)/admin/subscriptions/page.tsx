'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SubscriptionPlan } from '@/types/subscriptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatCard } from '@/components/shared/stat-card'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Check, ToggleLeft, ToggleRight, DollarSign, Users, TrendingUp, ArrowUpRight, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { ShineBorder } from '@/components/ui/shine-border'
import { NumberTicker } from '@/components/ui/number-ticker'

interface Sub { id: string; clientId: string; planId: string; status: string; currentPeriodStart?: string; currentPeriodEnd?: string }
interface Invoice { id: string; clientId: string; amount: number; status: string; periodStart: string; periodEnd: string; paidAt?: string; createdAt: string }
interface ClientOption { id: string; fullName: string }

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState({ name: '', description: '', price: '', interval: 'monthly' as 'monthly' | 'yearly', features: '' })
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', interval: 'monthly' as 'monthly' | 'yearly', features: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: plansData }, { data: subsData }, { data: invData }, { data: clientsData }] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('price'),
        supabase.from('client_subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
      ])
      setClients((clientsData ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
      setPlans((plansData ?? []).map((p: any) => ({
        id: p.id, name: p.name, description: p.description ?? undefined,
        price: p.price, currency: p.currency, interval: p.interval,
        features: p.features ?? [], isActive: p.is_active,
        stripePriceId: p.stripe_price_id ?? undefined, createdAt: p.created_at,
      })))
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
    load()
  }, [])

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const p = plans.find((pl) => pl.id === sub.planId)
    return sum + (p?.price ?? 0)
  }, 0)

  const revenueData = [
    { month: 'Oct', revenue: 0 }, { month: 'Nov', revenue: 0 }, { month: 'Dic', revenue: 0 },
    { month: 'Ene', revenue: 0 }, { month: 'Feb', revenue: 0 }, { month: 'Mar', revenue: mrr },
  ]
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.fullName ?? clientId
  const getPlanName = (planId: string) => plans.find((p) => p.id === planId)?.name ?? planId
  const clientInvoices = selectedClientId ? invoices.filter((inv) => inv.clientId === selectedClientId) : []

  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.price) { toast.error('Nombre y precio son requeridos'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('subscription_plans').insert({
      name: newPlan.name, description: newPlan.description || null,
      price: parseFloat(newPlan.price), currency: 'MXN', interval: newPlan.interval,
      features: newPlan.features.split('\n').filter((f) => f.trim()), is_active: true,
    }).select().single()
    if (error) { toast.error('Error al crear el plan'); return }
    setPlans((prev) => [...prev, { id: data.id, name: data.name, description: data.description ?? undefined, price: data.price, currency: data.currency, interval: data.interval, features: data.features ?? [], isActive: data.is_active, createdAt: data.created_at }])
    setNewPlan({ name: '', description: '', price: '', interval: 'monthly', features: '' })
    setDialogOpen(false)
    toast.success('Plan creado exitosamente')
  }

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setEditForm({ name: plan.name, description: plan.description ?? '', price: plan.price.toString(), interval: plan.interval, features: plan.features.join('\n') })
    setEditDialogOpen(true)
  }

  const handleEditPlan = async () => {
    if (!editingPlan || !editForm.name || !editForm.price) { toast.error('Nombre y precio son requeridos'); return }
    const supabase = createClient()
    const { error } = await supabase.from('subscription_plans').update({
      name: editForm.name, description: editForm.description || null,
      price: parseFloat(editForm.price), interval: editForm.interval,
      features: editForm.features.split('\n').filter((f) => f.trim()),
    }).eq('id', editingPlan.id)
    if (error) { toast.error('Error al actualizar el plan'); return }
    setPlans((prev) => prev.map((p) => p.id === editingPlan.id ? { ...p, name: editForm.name, description: editForm.description, price: parseFloat(editForm.price), interval: editForm.interval, features: editForm.features.split('\n').filter((f) => f.trim()) } : p))
    setEditDialogOpen(false)
    toast.success('Plan actualizado exitosamente')
  }

  const handleDeletePlan = async () => {
    if (!editingPlan) return
    const hasSubs = subscriptions.some((s) => s.planId === editingPlan.id && s.status === 'active')
    if (hasSubs) { toast.error('No se puede eliminar un plan con suscripciones activas'); setDeleteDialogOpen(false); return }
    const supabase = createClient()
    const { error } = await supabase.from('subscription_plans').delete().eq('id', editingPlan.id)
    if (error) { toast.error('Error al eliminar el plan'); return }
    setPlans((prev) => prev.filter((p) => p.id !== editingPlan.id))
    setDeleteDialogOpen(false)
    toast.success('Plan eliminado exitosamente')
  }

  const togglePlanActive = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return
    const supabase = createClient()
    await supabase.from('subscription_plans').update({ is_active: !plan.isActive }).eq('id', planId)
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, isActive: !p.isActive } : p))
    toast.success('Estado del plan actualizado')
  }

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
        <StatCard title="Planes Activos" value={plans.filter((p) => p.isActive).length} icon={<ArrowUpRight size={24} />} description="planes disponibles" />
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

        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Planes</h2>
              <p className="text-muted-foreground">Gestiona los planes de suscripción disponibles</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Nuevo Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear Nuevo Plan</DialogTitle><DialogDescription>Define las características del nuevo plan.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="Ej: Plan Premium" /></div>
                  <div className="space-y-2"><Label>Descripción</Label><Input value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} placeholder="Descripción del plan" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Precio (MXN)</Label><Input type="number" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} placeholder="0.00" /></div>
                    <div className="space-y-2">
                      <Label>Intervalo</Label>
                      <Select value={newPlan.interval} onValueChange={(v) => setNewPlan({ ...newPlan, interval: v as 'monthly' | 'yearly' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Características (una por línea)</Label><Textarea value={newPlan.features} onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })} placeholder="Característica 1&#10;Característica 2" rows={5} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreatePlan}>Crear Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden">
                {plan.price >= 1999 && <ShineBorder shineColor={['#d86226', '#7e230c', '#f59e0b']} duration={10} borderWidth={2} />}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>{plan.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  {plan.description && <CardDescription>{plan.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="mb-4"><span className="text-3xl font-bold">$<NumberTicker value={plan.price} /></span><span className="text-muted-foreground ml-1">MXN/mes</span></div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>{feature}</span></li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(plan)}><Edit className="mr-1 h-3 w-3" />Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => togglePlanActive(plan.id)}>
                      {plan.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingPlan(plan); setDeleteDialogOpen(true) }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div><h2 className="text-2xl font-bold tracking-tight">Suscripciones de Clientes</h2><p className="text-muted-foreground">Gestiona las suscripciones activas</p></div>
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
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Plan</DialogTitle><DialogDescription>Modifica las características del plan.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Precio (MXN)</Label><Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Intervalo</Label>
                <Select value={editForm.interval} onValueChange={(v) => setEditForm({ ...editForm, interval: v as 'monthly' | 'yearly' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Características (una por línea)</Label><Textarea value={editForm.features} onChange={(e) => setEditForm({ ...editForm, features: e.target.value })} rows={5} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditPlan}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar Plan</DialogTitle><DialogDescription>¿Estás seguro de que deseas eliminar el plan &quot;{editingPlan?.name}&quot;? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeletePlan}>Eliminar Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
