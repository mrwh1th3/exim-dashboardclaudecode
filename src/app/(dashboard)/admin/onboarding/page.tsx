'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Plus, Trash2, FileText, Layers, Users, Globe, Share2, Inbox, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { FlowTemplate, FlowStage, FormTemplate, FormField, FieldType, ClientFlow, FlowType, FlowStatus } from '@/types/onboarding'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Texto', textarea: 'Texto largo', select: 'Selección', multi_select: 'Selección múltiple',
  checkbox: 'Casillas', slider: 'Deslizador', file_upload: 'Subir archivo', color_picker: 'Color',
  font_picker: 'Tipografía', oauth_buttons: 'OAuth', date_picker: 'Fecha',
  rich_text: 'Texto enriquecido', number: 'Número', email: 'Email', url: 'URL', phone: 'Teléfono',
}
const allFieldTypes: FieldType[] = ['text', 'textarea', 'select', 'multi_select', 'checkbox', 'slider', 'file_upload', 'color_picker', 'font_picker', 'oauth_buttons', 'date_picker', 'rich_text', 'number', 'email', 'url', 'phone']
function generateId() { return Math.random().toString(36).substring(2, 12) }

interface ClientOption { id: string; fullName: string; companyName?: string; isActive: boolean }

interface SubmissionRow {
  id: string
  clientId: string
  clientFlowId: string
  formTemplateId: string
  stageId: string
  data: Record<string, unknown>
  submittedAt: string | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [flows, setFlows] = useState<FlowTemplate[]>([])
  const [stages, setStages] = useState<FlowStage[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [clientFlows, setClientFlows] = useState<ClientFlow[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRow | null>(null)
  const [submissionSheetOpen, setSubmissionSheetOpen] = useState(false)

  const [flowDialogOpen, setFlowDialogOpen] = useState(false)
  const [deleteFlowDialogOpen, setDeleteFlowDialogOpen] = useState(false)
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [newFlowType, setNewFlowType] = useState<FlowType>('web')

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formSheetOpen, setFormSheetOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null)
  const [newFormName, setNewFormName] = useState('')
  const [newFormDescription, setNewFormDescription] = useState('')
  const [newFormFields, setNewFormFields] = useState<Array<{ id: string; label: string; type: FieldType; required: boolean; options: string }>>([])

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignClientId, setAssignClientId] = useState('')
  const [assignFlowId, setAssignFlowId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: flowsData }, { data: stagesData }, { data: formsData }, { data: cfData }, { data: clientsData }, { data: subsData }] = await Promise.all([
        supabase.from('flow_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('flow_stages').select('*').order('order_index'),
        supabase.from('form_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('client_flows').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, company_name, is_active').eq('role', 'client').order('full_name'),
        supabase.from('form_submissions').select('*').order('submitted_at', { ascending: false }),
      ])
      setClients((clientsData ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '', companyName: c.company_name ?? undefined, isActive: c.is_active })))
      setFlows((flowsData ?? []).map((f: any) => ({ id: f.id, name: f.name, description: f.description ?? undefined, type: f.type as FlowType, isActive: f.is_active, createdBy: '', createdAt: f.created_at, updatedAt: f.updated_at })))
      setStages((stagesData ?? []).map((s: any) => ({ id: s.id, flowTemplateId: s.flow_template_id, name: s.name, description: s.description ?? undefined, orderIndex: s.order_index, formIds: s.form_ids ?? [], createdAt: s.created_at })))
      setForms((formsData ?? []).map((f: any) => ({ id: f.id, name: f.name, description: f.description ?? undefined, schema: f.schema ?? { fields: [] }, createdBy: '', createdAt: f.created_at, updatedAt: f.updated_at })))
      setClientFlows((cfData ?? []).map((cf: any) => ({ id: cf.id, clientId: cf.client_id, flowTemplateId: cf.flow_template_id, status: cf.status as FlowStatus, assignedBy: cf.assigned_by ?? '', startedAt: cf.started_at ?? undefined, completedAt: cf.completed_at ?? undefined, createdAt: cf.created_at })))
      setSubmissions((subsData ?? []).map((s: any) => ({ id: s.id, clientId: s.client_id, clientFlowId: s.client_flow_id, formTemplateId: s.form_template_id, stageId: s.stage_id, data: s.data ?? {}, submittedAt: s.submitted_at })))
    }
    load()
  }, [])

  async function handleCreateFlow() {
    if (!newFlowName.trim()) { toast.error('El nombre del flujo es requerido'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('flow_templates').insert({ name: newFlowName.trim(), description: newFlowDescription.trim() || null, type: newFlowType, is_active: true }).select().single()
    if (error) { toast.error('Error al crear el flujo'); return }
    setFlows((prev) => [{ id: data.id, name: data.name, description: data.description ?? undefined, type: data.type as FlowType, isActive: data.is_active, createdBy: '', createdAt: data.created_at, updatedAt: data.updated_at }, ...prev])
    setNewFlowName(''); setNewFlowDescription(''); setNewFlowType('web')
    setFlowDialogOpen(false)
    toast.success('Flujo creado exitosamente')
  }

  async function handleDeleteFlow() {
    if (!flowToDelete) return
    const supabase = createClient()
    const { error } = await supabase.from('flow_templates').delete().eq('id', flowToDelete)
    if (error) { toast.error('Error al eliminar'); return }
    setFlows((prev) => prev.filter((f) => f.id !== flowToDelete))
    setStages((prev) => prev.filter((s) => s.flowTemplateId !== flowToDelete))
    setClientFlows((prev) => prev.filter((cf) => cf.flowTemplateId !== flowToDelete))
    setFlowToDelete(null); setDeleteFlowDialogOpen(false)
    toast.success('Flujo eliminado')
  }

  function addFormField() {
    setNewFormFields((prev) => [...prev, { id: `field-${generateId()}`, label: '', type: 'text', required: false, options: '' }])
  }
  function updateFormField(index: number, updates: Partial<(typeof newFormFields)[0]>) {
    setNewFormFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)))
  }
  function removeFormField(index: number) {
    setNewFormFields((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateForm() {
    if (!newFormName.trim()) { toast.error('El nombre del formulario es requerido'); return }
    if (newFormFields.length === 0) { toast.error('Agrega al menos un campo'); return }
    if (newFormFields.some((f) => !f.label.trim())) { toast.error('Todos los campos deben tener un label'); return }
    const fields: FormField[] = newFormFields.map((f, index) => ({
      id: f.id, type: f.type, label: f.label.trim(), required: f.required, order: index,
      ...(f.type === 'select' || f.type === 'checkbox' ? { options: f.options.split('\n').map((o) => o.trim()).filter(Boolean) } : {}),
    }))
    const supabase = createClient()
    const { data, error } = await supabase.from('form_templates').insert({ name: newFormName.trim(), description: newFormDescription.trim() || null, schema: { fields } }).select().single()
    if (error) { toast.error('Error al crear el formulario'); return }
    setForms((prev) => [{ id: data.id, name: data.name, description: data.description ?? undefined, schema: data.schema, createdBy: '', createdAt: data.created_at, updatedAt: data.updated_at }, ...prev])
    setNewFormName(''); setNewFormDescription(''); setNewFormFields([])
    setFormDialogOpen(false)
    toast.success('Formulario creado exitosamente')
  }

  async function handleAssignFlow() {
    if (!assignClientId || !assignFlowId) { toast.error('Selecciona un cliente y un flujo'); return }
    const existing = clientFlows.find((cf) => cf.clientId === assignClientId && cf.flowTemplateId === assignFlowId)
    if (existing) { toast.error('Este cliente ya tiene asignado este flujo'); return }
    const supabase = createClient()
    const { data, error } = await supabase.from('client_flows').insert({ client_id: assignClientId, flow_template_id: assignFlowId, status: 'not_started', assigned_by: user?.id }).select().single()
    if (error) { toast.error('Error al asignar el flujo'); return }
    setClientFlows((prev) => [{ id: data.id, clientId: data.client_id, flowTemplateId: data.flow_template_id, status: data.status as FlowStatus, assignedBy: data.assigned_by ?? '', createdAt: data.created_at }, ...prev])
    setAssignClientId(''); setAssignFlowId('')
    setAssignDialogOpen(false)
    toast.success('Flujo asignado al cliente')
  }

  async function toggleFlowStatus(cfId: string) {
    const cf = clientFlows.find((c) => c.id === cfId)
    if (!cf) return
    const statusCycle: FlowStatus[] = ['not_started', 'in_progress', 'completed']
    const currentIndex = statusCycle.indexOf(cf.status)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]
    const supabase = createClient()
    const updates: Record<string, string | null> = { status: nextStatus }
    if (nextStatus === 'in_progress') updates.started_at = new Date().toISOString()
    if (nextStatus === 'completed') updates.completed_at = new Date().toISOString()
    await supabase.from('client_flows').update(updates).eq('id', cfId)
    setClientFlows((prev) => prev.map((c) => c.id === cfId ? { ...c, status: nextStatus, startedAt: nextStatus === 'in_progress' ? new Date().toISOString() : c.startedAt, completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined } : c))
  }

  function getClientName(clientId: string) { return clients.find((c) => c.id === clientId)?.fullName ?? 'Desconocido' }
  function getFlowName(flowTemplateId: string) { return flows.find((f) => f.id === flowTemplateId)?.name ?? 'Desconocido' }
  function getStageCount(flowId: string) { return stages.filter((s) => s.flowTemplateId === flowId).length }

  const statusLabels: Record<FlowStatus, string> = { not_started: 'Sin iniciar', in_progress: 'En progreso', completed: 'Completado' }
  const statusColors: Record<FlowStatus, string> = {
    not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground">Gestiona flujos, formularios y asignaciones de onboarding</p>
      </div>

      <Tabs defaultValue="flujos">
        <TabsList>
          <TabsTrigger value="flujos"><Layers className="mr-1.5 h-4 w-4" />Flujos</TabsTrigger>
          <TabsTrigger value="formularios"><FileText className="mr-1.5 h-4 w-4" />Formularios</TabsTrigger>
          <TabsTrigger value="asignaciones"><Users className="mr-1.5 h-4 w-4" />Asignaciones</TabsTrigger>
          <TabsTrigger value="respuestas"><Inbox className="mr-1.5 h-4 w-4" />Respuestas</TabsTrigger>
        </TabsList>

        <TabsContent value="flujos">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setFlowDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Nuevo Flujo</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flows.map((flow) => (
                <Card key={flow.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(`/admin/onboarding/${flow.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{flow.name}</CardTitle>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={flow.type === 'web' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-purple-200 bg-purple-50 text-purple-700'}>
                          {flow.type === 'web' ? <Globe className="mr-1 h-3 w-3" /> : <Share2 className="mr-1 h-3 w-3" />}
                          {flow.type === 'web' ? 'Web' : 'Social'}
                        </Badge>
                        <Badge variant={flow.isActive ? 'default' : 'secondary'}>{flow.isActive ? 'Activo' : 'Inactivo'}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {flow.description && <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{flow.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{getStageCount(flow.id)} etapa{getStageCount(flow.id) !== 1 ? 's' : ''}</span>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setFlowToDelete(flow.id); setDeleteFlowDialogOpen(true) }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {flows.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">No hay flujos creados. Crea tu primer flujo de onboarding.</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="formularios">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setFormDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Nuevo Formulario</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <Card key={form.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => { setSelectedForm(form); setFormSheetOpen(true) }}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{form.name}</CardTitle></CardHeader>
                  <CardContent>
                    {form.description && <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{form.description}</p>}
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{form.schema.fields.length} campo{form.schema.fields.length !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {forms.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">No hay formularios creados.</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="asignaciones">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAssignDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Asignar Flujo</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead><TableHead>Flujo</TableHead><TableHead>Estado</TableHead>
                      <TableHead>Asignado</TableHead><TableHead>Inicio</TableHead><TableHead>Fin</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientFlows.map((cf) => (
                      <TableRow key={cf.id}>
                        <TableCell className="font-medium">{getClientName(cf.clientId)}</TableCell>
                        <TableCell>{getFlowName(cf.flowTemplateId)}</TableCell>
                        <TableCell><Badge variant="outline" className={statusColors[cf.status]}>{statusLabels[cf.status]}</Badge></TableCell>
                        <TableCell>{new Date(cf.createdAt).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{cf.startedAt ? new Date(cf.startedAt).toLocaleDateString('es-MX') : '-'}</TableCell>
                        <TableCell>{cf.completedAt ? new Date(cf.completedAt).toLocaleDateString('es-MX') : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => toggleFlowStatus(cf.id)}>Cambiar estado</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {clientFlows.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No hay asignaciones.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="respuestas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Formulario</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => {
                    const form = forms.find((f) => f.id === sub.formTemplateId)
                    const stage = stages.find((s) => s.id === sub.stageId)
                    const client = clients.find((c) => c.id === sub.clientId)
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{client?.fullName ?? 'Desconocido'}</TableCell>
                        <TableCell>{form?.name ?? 'Desconocido'}</TableCell>
                        <TableCell>{stage?.name ?? 'Desconocido'}</TableCell>
                        <TableCell>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('es-MX') : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedSubmission(sub); setSubmissionSheetOpen(true) }}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Ver respuestas
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {submissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                        No hay respuestas de formularios aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet: Ver respuestas de formulario */}
      <Sheet open={submissionSheetOpen} onOpenChange={setSubmissionSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedSubmission && (() => {
            const form = forms.find((f) => f.id === selectedSubmission.formTemplateId)
            const client = clients.find((c) => c.id === selectedSubmission.clientId)
            const stage = stages.find((s) => s.id === selectedSubmission.stageId)
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{form?.name ?? 'Formulario'}</SheetTitle>
                  <SheetDescription>
                    {client?.fullName ?? 'Cliente'} · Etapa: {stage?.name ?? '-'} ·{' '}
                    {selectedSubmission.submittedAt
                      ? new Date(selectedSubmission.submittedAt).toLocaleDateString('es-MX')
                      : ''}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {form?.schema.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => {
                      const value = selectedSubmission.data[field.id]
                      const displayValue = Array.isArray(value)
                        ? (value as string[]).join(', ')
                        : value !== undefined && value !== null && value !== ''
                        ? String(value)
                        : '—'
                      return (
                        <div key={field.id} className="space-y-1 rounded-lg border p-3">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{field.label}</p>
                          <p className="text-sm">{displayValue}</p>
                        </div>
                      )
                    })}
                  {(!form?.schema.fields || form.schema.fields.length === 0) && (
                    <p className="text-sm text-muted-foreground">No hay campos en este formulario.</p>
                  )}
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* Dialog: Nuevo Flujo */}
      <Dialog open={flowDialogOpen} onOpenChange={setFlowDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Flujo</DialogTitle><DialogDescription>Crea un nuevo flujo de onboarding</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre</Label><Input value={newFlowName} onChange={(e) => setNewFlowName(e.target.value)} placeholder="Ej: Onboarding Web Premium" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={newFlowDescription} onChange={(e) => setNewFlowDescription(e.target.value)} placeholder="Describe el propósito de este flujo..." rows={3} /></div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newFlowType} onValueChange={(v) => setNewFlowType(v as FlowType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="web"><Globe className="mr-2 inline h-4 w-4" />Web</SelectItem>
                  <SelectItem value="social"><Share2 className="mr-2 inline h-4 w-4" />Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlowDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateFlow}>Crear Flujo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar Flujo */}
      <Dialog open={deleteFlowDialogOpen} onOpenChange={setDeleteFlowDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar Flujo</DialogTitle><DialogDescription>Esta acción eliminará el flujo y todas sus etapas. No se puede deshacer.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFlowDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteFlow}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Formulario */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Formulario</DialogTitle><DialogDescription>Crea un formulario con campos personalizados</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre del formulario</Label><Input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} placeholder="Ej: Información de Marca" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={newFormDescription} onChange={(e) => setNewFormDescription(e.target.value)} placeholder="Describe el propósito..." rows={2} /></div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Campos</Label>
                <Button variant="outline" size="sm" onClick={addFormField}><Plus className="mr-1 h-3.5 w-3.5" />Agregar Campo</Button>
              </div>
              {newFormFields.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No hay campos. Haz clic en &quot;Agregar Campo&quot; para empezar.</p>}
              {newFormFields.map((field, index) => (
                <Card key={field.id} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <Label>Label</Label>
                        <Input value={field.label} onChange={(e) => updateFormField(index, { label: e.target.value })} placeholder="Nombre del campo" />
                      </div>
                      <div className="w-40 space-y-2">
                        <Label>Tipo</Label>
                        <Select value={field.type} onValueChange={(v) => updateFormField(index, { type: v as FieldType })}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>{allFieldTypes.map((ft) => <SelectItem key={ft} value={ft}>{fieldTypeLabels[ft]}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="pt-7">
                        <Button variant="ghost" size="icon-sm" onClick={() => removeFormField(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={field.required} onCheckedChange={(checked) => updateFormField(index, { required: checked === true })} />
                      <Label className="text-sm font-normal">Requerido</Label>
                    </div>
                    {(field.type === 'select' || field.type === 'checkbox') && (
                      <div className="space-y-2">
                        <Label>Opciones (una por línea)</Label>
                        <Textarea value={field.options} onChange={(e) => updateFormField(index, { options: e.target.value })} placeholder={'Opción 1\nOpción 2\nOpción 3'} rows={3} />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateForm}>Crear Formulario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet: Form Preview */}
      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedForm?.name}</SheetTitle>
            {selectedForm?.description && <SheetDescription>{selectedForm.description}</SheetDescription>}
          </SheetHeader>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {selectedForm?.schema.fields.sort((a, b) => a.order - b.order).map((field) => (
                <div key={field.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{field.label}</span>
                    {field.required && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Requerido</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{fieldTypeLabels[field.type]}</Badge>
                    {field.placeholder && <span>Placeholder: {field.placeholder}</span>}
                  </div>
                  {field.options && field.options.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-muted-foreground">Opciones: </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {field.options.map((opt, i) => <Badge key={i} variant="outline" className="text-[10px]">{opt}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialog: Asignar Flujo */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} disablePointerDismissal={true}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Asignar Flujo</DialogTitle><DialogDescription>Asigna un flujo de onboarding a un cliente</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={assignClientId} onValueChange={(v) => setAssignClientId(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.filter((c) => c.isActive).map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.fullName}{client.companyName ? ` - ${client.companyName}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Flujo</Label>
              <Select value={assignFlowId} onValueChange={(v) => setAssignFlowId(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un flujo" /></SelectTrigger>
                <SelectContent>
                  {flows.filter((f) => f.isActive).map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssignFlow}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
