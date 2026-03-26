'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit, Globe, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FlowTemplate {
  id: string
  name: string
  type: 'web' | 'social'
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
}

interface ClientRow {
  id: string
  email: string
  fullName: string
  companyName?: string
  isActive: boolean
  serviceType?: 'web' | 'social' | 'both'
  flowTemplateIds: string[]
  subscriptionPlanId?: string
}

export default function ClientsListPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [search, setSearch] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editServiceType, setEditServiceType] = useState<'web' | 'social' | 'both' | ''>('')
  const [editFlowIds, setEditFlowIds] = useState<string[]>([])
  const [editPlanId, setEditPlanId] = useState('')

  const [flowTemplates, setFlowTemplates] = useState<FlowTemplate[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: profiles }, { data: flows }, { data: templates }, { data: subscriptions }, { data: plansData }] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, company_name, is_active, service_type').eq('role', 'client').order('full_name'),
        supabase.from('client_flows').select('client_id, flow_template_id'),
        supabase.from('flow_templates').select('id, name, type'),
        supabase.from('client_subscriptions').select('client_id, plan_id'),
        supabase.from('subscription_plans').select('id, name, price, currency, interval').eq('is_active', true),
      ])

      setFlowTemplates((templates ?? []).map((t: any) => ({ id: t.id, name: t.name, type: t.type })))
      setSubscriptionPlans((plansData ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency ?? 'MXN',
        interval: p.interval ?? 'monthly'
      })))

      // Build a map of client_id -> array of flow_template_ids
      const flowMap = new Map<string, string[]>()
      ;(flows ?? []).forEach((f: any) => {
        const existing = flowMap.get(f.client_id) || []
        flowMap.set(f.client_id, [...existing, f.flow_template_id])
      })

      const planMap = new Map((subscriptions ?? []).map((s: any) => [s.client_id, s.plan_id]))

      setClients(
        (profiles ?? []).map((p: any) => {
          const flowTemplateIds = flowMap.get(p.id) || []
          const planId = planMap.get(p.id)

          // Use service_type from profile, or derive from flows if not set
          let serviceType = p.service_type as 'web' | 'social' | 'ambos' | undefined

          return {
            id: p.id,
            email: p.email,
            fullName: p.full_name ?? '',
            companyName: p.company_name ?? undefined,
            isActive: p.is_active ?? true,
            serviceType,
            flowTemplateIds,
            subscriptionPlanId: planId,
          }
        })
      )
    }
    load()
  }, [])

  const filteredClients = clients.filter((client) => {
    const q = search.toLowerCase()
    return (
      client.fullName.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.companyName?.toLowerCase().includes(q) ?? false)
    )
  })

  async function handleDeleteClient() {
    if (!clientToDelete) return
    
    try {
      // Use admin client for proper cascade deletion
      const { getAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = getAdminClient()
      
      // 1. Delete client flows (this will cascade to stage progress and form submissions)
      const { error: flowsError } = await adminClient
        .from('client_flows')
        .delete()
        .eq('client_id', clientToDelete)
      
      // 2. Delete client subscriptions
      const { error: subscriptionsError } = await adminClient
        .from('client_subscriptions')
        .delete()
        .eq('client_id', clientToDelete)
      
      // 3. Delete client requests
      const { error: requestsError } = await adminClient
        .from('requests')
        .delete()
        .eq('client_id', clientToDelete)
      
      // 4. Delete the profile (using admin client to bypass RLS)
      const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', clientToDelete)
      
      // 5. Delete the auth user
      const { error: authError } = await adminClient.auth.admin.deleteUser(clientToDelete)
      
      if (flowsError || subscriptionsError || requestsError || profileError || authError) {
        console.error('Delete errors:', { 
          flowsError, 
          subscriptionsError, 
          requestsError, 
          profileError, 
          authError 
        })
        toast.error('Error al eliminar el cliente')
        return
      }
      
      setClients((prev) => prev.filter(c => c.id !== clientToDelete))
      setClientToDelete(null)
      setDeleteDialogOpen(false)
      toast.success('Cliente y todos sus datos eliminados')
      
    } catch (error) {
      console.error('Delete client error:', error)
      toast.error('Error al eliminar el cliente')
    }
  }

  function openEditClient(client: ClientRow) {
    setEditingClient(client)
    setEditName(client.fullName)
    setEditCompany(client.companyName || '')
    setEditServiceType(client.serviceType || '')
    setEditFlowIds(client.flowTemplateIds || [])
    setEditPlanId(client.subscriptionPlanId || '')
    setEditDialogOpen(true)
  }

  function toggleFlowSelection(flowId: string) {
    setEditFlowIds(prev =>
      prev.includes(flowId)
        ? prev.filter(id => id !== flowId)
        : [...prev, flowId]
    )
  }

  async function handleUpdateClient() {
    if (!editingClient || !editName.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    const supabase = createClient()

    try {
      // 1. Update Profile (including service_type)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editName.trim(),
          company_name: editCompany.trim() || null,
          service_type: editServiceType || null
        })
        .eq('id', editingClient.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        toast.error(`Error al actualizar perfil: ${profileError.message}`)
        return
      }

      // 2. Sync Flows - Delete removed, add new ones
      const currentFlowIds = editingClient.flowTemplateIds || []
      const flowsToRemove = currentFlowIds.filter(id => !editFlowIds.includes(id))
      const flowsToAdd = editFlowIds.filter(id => !currentFlowIds.includes(id))

      // Remove flows that were unchecked
      if (flowsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('client_flows')
          .delete()
          .eq('client_id', editingClient.id)
          .in('flow_template_id', flowsToRemove)

        if (deleteError) {
          console.error('Flow delete error:', deleteError)
          toast.error(`Error al eliminar flujos: ${deleteError.message}`)
          return
        }
      }

      // Add new flows
      if (flowsToAdd.length > 0) {
        const newFlows = flowsToAdd.map(flowId => ({
          client_id: editingClient.id,
          flow_template_id: flowId,
          status: 'not_started'
        }))
        const { error: insertError } = await supabase.from('client_flows').insert(newFlows)

        if (insertError) {
          console.error('Flow insert error:', insertError)
          toast.error(`Error al asignar flujos: ${insertError.message}`)
          return
        }
      }

      // 3. Upsert Plan
      if (editPlanId && editPlanId !== 'none') {
        if (editingClient.subscriptionPlanId) {
          const { error: updatePlanError } = await supabase
            .from('client_subscriptions')
            .update({ plan_id: editPlanId, updated_at: new Date().toISOString() })
            .eq('client_id', editingClient.id)

          if (updatePlanError) {
            console.error('Plan update error:', updatePlanError)
            toast.error(`Error al actualizar plan: ${updatePlanError.message}`)
            return
          }
        } else {
          const { error: insertPlanError } = await supabase
            .from('client_subscriptions')
            .insert({
              client_id: editingClient.id,
              plan_id: editPlanId,
              status: 'active',
              current_period_start: new Date().toISOString()
            })

          if (insertPlanError) {
            console.error('Plan insert error:', insertPlanError)
            toast.error(`Error al asignar plan: ${insertPlanError.message}`)
            return
          }
        }
      } else if (editingClient.subscriptionPlanId && editPlanId === 'none') {
        const { error: deletePlanError } = await supabase
          .from('client_subscriptions')
          .delete()
          .eq('client_id', editingClient.id)

        if (deletePlanError) {
          console.error('Plan delete error:', deletePlanError)
          toast.error(`Error al eliminar plan: ${deletePlanError.message}`)
          return
        }
      }

      // Update local state
      setClients((prev) => prev.map(c => c.id === editingClient.id ? {
        ...c,
        fullName: editName.trim(),
        companyName: editCompany.trim() || undefined,
        serviceType: editServiceType || undefined,
        flowTemplateIds: editFlowIds,
        subscriptionPlanId: editPlanId === 'none' ? undefined : editPlanId,
      } : c))

      setEditDialogOpen(false)
      setEditingClient(null)
      toast.success('Cliente actualizado correctamente')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Error inesperado al guardar cambios')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona todos tus clientes</p>
        </div>
        <Link href="/admin/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, empresa o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/admin/clients/${client.id}`} className="font-medium hover:underline">
                      {client.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{client.companyName ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {client.serviceType === 'web' ? 'Web' :
                       client.serviceType === 'social' ? 'Redes Sociales' :
                       client.serviceType === 'both' ? 'Ambos' : 'Sin servicio'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.isActive ? (
                      <Badge variant="outline" className="border-green-500/40 bg-green-500/10 text-green-400">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditClient(client)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setClientToDelete(client.id); setDeleteDialogOpen(true) }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Delete Client */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              Esta acción eliminará al cliente y todos sus datos asociados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteClient}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Client */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Modifica la información general y los servicios asignados a este cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empresa (Opcional)</Label>
              <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Servicio</Label>
              <Select value={editServiceType || 'none'} onValueChange={(v) => setEditServiceType(v === 'none' ? '' : v as 'web' | 'social' | 'both')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de servicio..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tipo de servicio</SelectItem>
                  <SelectItem value="web">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span>Web</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="social">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-purple-500" />
                      <span>Redes Sociales</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <Share2 className="h-4 w-4 text-purple-500 -ml-1" />
                      <span>Ambos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Flujos de Onboarding</Label>
              <p className="text-xs text-muted-foreground -mt-1">Selecciona uno o más flujos para asignar al cliente</p>
              {flowTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay flujos disponibles</p>
              ) : (
                <div className="space-y-2 rounded-lg border p-3 max-h-[200px] overflow-y-auto">
                  {flowTemplates.map((flow) => (
                    <label
                      key={flow.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={editFlowIds.includes(flow.id)}
                        onCheckedChange={() => toggleFlowSelection(flow.id)}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {flow.type === 'web' ? (
                          <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <Share2 className="h-4 w-4 text-purple-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{flow.name}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {flow.type === 'web' ? 'Web' : 'Social'}
                        </Badge>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Plan de Suscripción</Label>
              {subscriptionPlans.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 border rounded-lg px-3">No hay planes disponibles. Importa planes desde Stripe en la sección de Suscripciones.</p>
              ) : (
                <Select value={editPlanId || 'none'} onValueChange={setEditPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin plan de Suscripción</SelectItem>
                    {subscriptionPlans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ${p.price.toLocaleString()} {p.currency}/{p.interval === 'monthly' ? 'mes' : 'año'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateClient}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
