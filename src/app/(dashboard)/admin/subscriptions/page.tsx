'use client'

import { useState } from 'react'
import { mockPlans, mockClientSubscriptions } from '@/data/mock-subscriptions'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Edit, Check, ToggleLeft, ToggleRight } from 'lucide-react'

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState(mockPlans)
  const [subscriptions, setSubscriptions] = useState(mockClientSubscriptions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    interval: 'monthly' as 'monthly' | 'yearly',
    features: '',
  })

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

  return (
    <div className="space-y-8">
      {/* Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
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
          {plans.map((plan) => (
            <Card key={plan.id}>
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
                  <span className="text-3xl font-bold">${plan.price.toLocaleString()}</span>
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
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="mr-2 h-3 w-3" />
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Client Subscriptions Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Suscripciones de Clientes</h2>
        <Card>
          <CardContent className="p-0">
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
                {subscriptions.map((sub) => (
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
                      {sub.currentPeriodStart && sub.currentPeriodEnd
                        ? `${new Date(sub.currentPeriodStart).toLocaleDateString('es-MX')} - ${new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX')}`
                        : '-'}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
