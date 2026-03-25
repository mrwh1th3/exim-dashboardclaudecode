'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Clock, Lock, Edit, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = use(params)
  const [client, setClient] = useState<any>(null)
  const [flowTemplate, setFlowTemplate] = useState<any>(null)
  const [flowStages, setFlowStages] = useState<any[]>([])
  const [clientFlow, setClientFlow] = useState<any>(null)
  const [stageProgress, setStageProgress] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const [flowTemplates, setFlowTemplates] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [selectedFlowId, setSelectedFlowId] = useState<string>('')
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      // Load client profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single()
      setClient(profile)
      setLoading(false)

      // Load flow with template and stages
      const { data: flow } = await supabase
        .from('client_flows')
        .select('*, flow_templates(id, name, flow_stages(id, name, description, order_index))')
        .eq('client_id', clientId)
        .maybeSingle()
      if (flow) {
        setClientFlow(flow)
        const template = flow.flow_templates
        if (template) {
          setFlowTemplate(template)
          setFlowStages(
            [...(template.flow_stages ?? [])].sort(
              (a: any, b: any) => a.order_index - b.order_index
            )
          )
          const { data: progress } = await supabase
            .from('client_stage_progress')
            .select('*')
            .eq('client_flow_id', flow.id)
          setStageProgress(progress ?? [])
        }
      }

      // Load requests
      const { data: reqs } = await supabase
        .from('requests')
        .select('*, request_statuses(id, name, color)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      setRequests(reqs ?? [])

      // Load subscription + plan
      const { data: sub } = await supabase
        .from('client_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('client_id', clientId)
        .maybeSingle()
      if (sub) {
        setSubscription(sub)
        setPlan(sub.subscription_plans)
      }

      // Load available flows and plans globally
      const [{ data: flowsData }, { data: plansData }] = await Promise.all([
        supabase.from('flow_templates').select('id, name, type').eq('is_active', true),
        supabase.from('subscription_plans').select('id, name').eq('is_active', true)
      ])
      setFlowTemplates(flowsData ?? [])
      setPlans(plansData ?? [])
    })()
  }, [clientId])

  const getStageStatusIcon = (stageId: string) => {
    const progress = stageProgress.find((sp) => sp.stage_id === stageId)
    if (!progress) return <Circle className="h-5 w-5 text-muted-foreground" />
    switch (progress.status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-500" />
      case 'locked': return <Lock className="h-5 w-5 text-muted-foreground" />
      default: return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStageStatusLabel = (stageId: string) => {
    const progress = stageProgress.find((sp) => sp.stage_id === stageId)
    if (!progress) return 'Sin iniciar'
    switch (progress.status) {
      case 'completed': return 'Completado'
      case 'in_progress': return 'En progreso'
      case 'locked': return 'Bloqueado'
      default: return 'Disponible'
    }
  }

  async function handleUpdateStageStatus(stageId: string, newStatus: string) {
    if (!clientFlow) return
    const supabase = createClient()
    const { error } = await supabase
      .from('client_stage_progress')
      .upsert(
        { client_flow_id: clientFlow.id, stage_id: stageId, status: newStatus },
        { onConflict: 'client_flow_id,stage_id' }
      )
    if (error) {
      toast.error('Error al actualizar la etapa')
      return
    }
    setStageProgress((prev) => {
      const existing = prev.find((sp) => sp.stage_id === stageId)
      if (existing) {
        return prev.map((sp) => sp.stage_id === stageId ? { ...sp, status: newStatus } : sp)
      }
      return [...prev, { stage_id: stageId, client_flow_id: clientFlow.id, status: newStatus }]
    })
    toast.success('Etapa actualizada')
  }

  function openEditDialog() {
    setEditName(client.full_name || '')
    setEditEmail(client.email || '')
    setEditCompany(client.company_name || '')
    setEditPhone(client.phone || '')
    setEditIsActive(client.is_active ?? true)
    setEditDialogOpen(true)
  }

  async function handleUpdateProfile() {
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Nombre y correo son requeridos')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editName.trim(),
        email: editEmail.trim(),
        company_name: editCompany.trim() || null,
        phone: editPhone.trim() || null,
        is_active: editIsActive
      })
      .eq('id', clientId)

    if (error) {
      toast.error('Error al actualizar perfil')
      setSaving(false)
      return
    }

    setClient((prev: any) => ({
      ...prev,
      full_name: editName.trim(),
      email: editEmail.trim(),
      company_name: editCompany.trim() || null,
      phone: editPhone.trim() || null,
      is_active: editIsActive
    }))
    toast.success('Perfil actualizado exitosamente')
    setSaving(false)
    setEditDialogOpen(false)
  }

  function openServiceDialog() {
    setSelectedFlowId(clientFlow?.flow_templates?.id || '')
    setSelectedPlanId(plan?.id || '')
    setServiceDialogOpen(true)
  }

  async function handleChangeService() {
    setSaving(true)
    const supabase = createClient()

    // Update Flow
    if (selectedFlowId !== clientFlow?.flow_templates?.id) {
      if (clientFlow) {
        await supabase.from('client_flows').update({ flow_template_id: selectedFlowId }).eq('id', clientFlow.id)
      } else if (selectedFlowId) {
        await supabase.from('client_flows').insert({ client_id: clientId, flow_template_id: selectedFlowId, status: 'not_started' })
      }
    }

    // Update Plan
    if (selectedPlanId !== plan?.id) {
      if (subscription) {
        await supabase.from('client_subscriptions').update({ plan_id: selectedPlanId }).eq('id', subscription.id)
      } else if (selectedPlanId) {
        await supabase.from('client_subscriptions').insert({ client_id: clientId, plan_id: selectedPlanId, status: 'active' })
      }
    }

    toast.success('Servicios actualizados. Recarga para ver todos los cambios.')
    setSaving(false)
    setServiceDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{client.full_name}</h1>
            {client.is_active ? (
              <Badge variant="outline" className="border-green-500 text-green-600">Activo</Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-600">Inactivo</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{client.company_name} &middot; {client.email}{client.phone ? ` · ${client.phone}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openServiceDialog}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Servicio
          </Button>
          <Button variant="outline" onClick={openEditDialog}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
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
                <div className="space-y-3">
                  {flowStages.map((stage, index) => {
                    const currentStatus = stageProgress.find((sp) => sp.stage_id === stage.id)?.status ?? 'available'
                    return (
                      <div key={stage.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-0.5 shrink-0">{getStageStatusIcon(stage.id)}</div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm">
                              Etapa {index + 1}: {stage.name}
                            </h3>
                            {stage.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
                            )}
                          </div>
                        </div>
                        <Select
                          value={currentStatus}
                          onValueChange={(v) => handleUpdateStageStatus(stage.id, v)}
                          disabled={!clientFlow}
                        >
                          <SelectTrigger className="w-full sm:w-36 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponible</SelectItem>
                            <SelectItem value="in_progress">En progreso</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
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
              {requests.length > 0 ? (
                <div className="overflow-x-auto">
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
                      {requests.map((req) => {
                        const status = req.request_statuses
                        return (
                          <TableRow key={req.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {req.type === 'page_change' ? 'Cambio' : 'Producto'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {req.type === 'page_change' ? req.page_section : req.product_title}
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
                              {new Date(req.created_at).toLocaleDateString('es-MX')}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
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
                        {subscription.current_period_start
                          ? new Date(subscription.current_period_start).toLocaleDateString('es-MX')
                          : '-'}{' '}
                        -{' '}
                        {subscription.current_period_end
                          ? new Date(subscription.current_period_end).toLocaleDateString('es-MX')
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {plan.features?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Características del plan</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature: string, i: number) => (
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifica toda la información del cliente aquí.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresa (Opcional)</Label>
              <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono (Opcional)</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="flex items-center justify-between mt-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Cuenta Activa</Label>
                <p className="text-sm text-muted-foreground">
                  Desactiva para bloquear su acceso.
                </p>
              </div>
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleUpdateProfile} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Servicio</DialogTitle>
            <DialogDescription>Modifica el flujo de onboarding y el plan de suscripción de este cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Flujo de Onboarding</Label>
              <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un flujo" />
                </SelectTrigger>
                <SelectContent>
                  {flowTemplates.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name} ({f.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan de Suscripción</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleChangeService} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
