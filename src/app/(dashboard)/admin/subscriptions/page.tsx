'use client'

import { useState } from 'react'
import { mockPlans, mockClientSubscriptions, mockInvoices } from '@/data/mock-subscriptions'
import { mockClients } from '@/data/mock-clients'
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
import { Switch } from '@/components/ui/switch'
import { StatCard } from '@/components/shared/stat-card'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Check, ToggleLeft, ToggleRight, DollarSign, Users, TrendingUp, ArrowUpRight, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { ShineBorder } from '@/components/ui/shine-border'
import { NumberTicker } from '@/components/ui/number-ticker'

const revenueData = [
  { month: 'Oct', revenue: 4497 },
  { month: 'Nov', revenue: 5996 },
  { month: 'Dec', revenue: 5996 },
  { month: 'Ene', revenue: 6995 },
  { month: 'Feb', revenue: 6995 },
  { month: 'Mar', revenue: 6995 },
]

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState(mockPlans)
  const [subscriptions, setSubscriptions] = useState(mockClientSubscriptions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    features: '',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    features: '',
  })

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
  const mrr = activeSubscriptions.reduce((sum, sub) => {
    const plan = plans.find((p) => p.id === sub.planId)
    return sum + (plan?.price ?? 0)
  }, 0)
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
  const growth = revenueData.length >= 2
    ? (((revenueData[revenueData.length - 1].revenue - revenueData[revenueData.length - 2].revenue) / revenueData[revenueData.length - 2].revenue) * 100)
    : 0

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.price) {
      toast.error('Nombre y precio son requeridos')
      return
    }
    const plan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: newPlan.name,
      description: newPlan.description,
      price: parseFloat(newPlan.price),
      currency: 'MXN',
      interval: newPlan.interval,
      features: newPlan.features.split('\n').filter((f) => f.trim()),
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    setPlans([...plans, plan])
    setNewPlan({ name: '', description: '', price: '', interval: 'monthly', features: '' })
    setDialogOpen(false)
    toast.success('Plan creado exitosamente')
  }

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setEditForm({
      name: plan.name,
      description: plan.description ?? '',
      price: plan.price.toString(),
      interval: plan.interval,
      features: plan.features.join('\n'),
    })
    setEditDialogOpen(true)
  }

  const handleEditPlan = () => {
    if (!editingPlan || !editForm.name || !editForm.price) {
      toast.error('Nombre y precio son requeridos')
      return
    }
    setPlans((prev) =>
      prev.map((p) =>
        p.id === editingPlan.id
          ? {
              ...p,
              name: editForm.name,
              description: editForm.description,
              price: parseFloat(editForm.price),
              interval: editForm.interval,
              features: editForm.features.split('\n').filter((f) => f.trim()),
            }
          : p
      )
    )
    setEditDialogOpen(false)
    setEditingPlan(null)
    toast.success('Plan actualizado exitosamente')
  }

  const handleDeletePlan = () => {
    if (!editingPlan) return
    const hasSubs = subscriptions.some((s) => s.planId === editingPlan.id && s.status === 'active')
    if (hasSubs) {
      toast.error('No se puede eliminar un plan con suscripciones activas')
      setDeleteDialogOpen(false)
      return
    }
    setPlans((prev) => prev.filter((p) => p.id !== editingPlan.id))
    setDeleteDialogOpen(false)
    setEditingPlan(null)
    toast.success('Plan eliminado exitosamente')
  }

  const togglePlanActive = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, isActive: !p.isActive } : p))
    )
    toast.success('Estado del plan actualizado')
  }

  const toggleSubscriptionStatus = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subId
          ? { ...sub, status: sub.status === 'active' ? 'inactive' : 'active' }
          : sub
      )
    )
    toast.success('Estado de suscripción actualizado')
  }

  const getClientName = (clientId: string) => {
    const client = mockClients.find((c) => c.id === clientId)
    return client?.fullName ?? clientId
  }

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    return plan?.name ?? planId
  }

  const openInvoiceSheet = (clientId: string) => {
    setSelectedClientId(clientId)
    setInvoiceSheetOpen(true)
  }

  const clientInvoices = selectedClientId
    ? mockInvoices.filter((inv) => inv.clientId === selectedClientId)
    : []

  return (
    <div className="space-y-8">
      {/* Stats Row */}
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
          description="Últimos 6 meses"
        />
        <StatCard
          title="Tasa de Crecimiento"
          value={`${growth.toFixed(1)}%`}
          icon={<ArrowUpRight size={24} />}
          trend={{ value: growth, label: 'vs mes anterior' }}
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Mensuales</CardTitle>
          <CardDescription>Evolución de ingresos en los últimos 6 meses</CardDescription>
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

      {/* Tabs */}
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Planes</h2>
              <p className="text-muted-foreground">Gestiona los planes de suscripción disponibles</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Plan</DialogTitle>
                  <DialogDescription>Define las características del nuevo plan de suscripción.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-name">Nombre</Label>
                    <Input
                      id="plan-name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="Ej: Plan Premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-desc">Descripción</Label>
                    <Input
                      id="plan-desc"
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Descripción del plan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-price">Precio (MXN)</Label>
                      <Input
                        id="plan-price"
                        type="number"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-interval">Intervalo</Label>
                      <Select
                        value={newPlan.interval}
                        onValueChange={(v) => setNewPlan({ ...newPlan, interval: v as 'monthly' | 'yearly' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-features">Características (una por línea)</Label>
                    <Textarea
                      id="plan-features"
                      value={newPlan.features}
                      onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                      placeholder="Página web ilimitada&#10;Soporte 24/7&#10;SEO incluido"
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePlan}>Crear Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plans.map((plan) => {
              const isFeatured = plan.price >= 1999
              return (
              <Card key={plan.id} className="relative overflow-hidden">
                {isFeatured && (
                  <ShineBorder shineColor={['#d86226', '#7e230c', '#f59e0b']} duration={10} borderWidth={2} />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {plan.description && (
                    <CardDescription>{plan.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$<NumberTicker value={plan.price} /></span>
                    <span className="text-muted-foreground ml-1">MXN/mes</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(plan)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlanActive(plan.id)}
                      title={plan.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {plan.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingPlan(plan); setDeleteDialogOpen(true) }}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Suscripciones de Clientes</h2>
            <p className="text-muted-foreground">Gestiona las suscripciones activas y su historial</p>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const clientInvs = mockInvoices.filter((inv) => inv.clientId === sub.clientId)
                    const lastPaid = clientInvs.find((inv) => inv.status === 'paid')
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{getClientName(sub.clientId)}</TableCell>
                        <TableCell>{getPlanName(sub.planId)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.status === 'active' ? 'default' : 'destructive'}
                            className={
                              sub.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : sub.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 hover:bg-red-100'
                                : ''
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
                          {lastPaid?.paidAt
                            ? new Date(lastPaid.paidAt).toLocaleDateString('es-MX')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.currentPeriodStart && sub.currentPeriodEnd
                            ? `${new Date(sub.currentPeriodStart).toLocaleDateString('es-MX')} - ${new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX')}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubscriptionStatus(sub.id)}
                            >
                              {sub.status === 'active' ? (
                                <ToggleRight className="mr-1 h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="mr-1 h-4 w-4 text-muted-foreground" />
                              )}
                              {sub.status === 'active' ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInvoiceSheet(sub.clientId)}
                            >
                              <FileText className="mr-1 h-4 w-4" />
                              Ver Facturas
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

      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plan</DialogTitle>
            <DialogDescription>Modifica las características del plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-plan-name">Nombre</Label>
              <Input
                id="edit-plan-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan-desc">Descripción</Label>
              <Input
                id="edit-plan-desc"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-plan-price">Precio (MXN)</Label>
                <Input
                  id="edit-plan-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plan-interval">Intervalo</Label>
                <Select
                  value={editForm.interval}
                  onValueChange={(v) => setEditForm({ ...editForm, interval: v as 'monthly' | 'yearly' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan-features">Características (una por línea)</Label>
              <Textarea
                id="edit-plan-features"
                value={editForm.features}
                onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditPlan}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Plan</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el plan &quot;{editingPlan?.name}&quot;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Eliminar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Sheet */}
      <Sheet open={invoiceSheetOpen} onOpenChange={setInvoiceSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Facturas - {selectedClientId ? getClientName(selectedClientId) : ''}</SheetTitle>
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
                      {new Date(inv.periodStart).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
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
                ))}
                {clientInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
