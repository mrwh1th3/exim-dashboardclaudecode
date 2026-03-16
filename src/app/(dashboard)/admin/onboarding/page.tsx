'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  FileText,
  Layers,
  Users,
  Globe,
  Share2,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  mockFlowTemplates,
  mockFlowStages,
  mockFormTemplates,
  mockClientFlows,
} from '@/data/mock-flows'
import { mockClients } from '@/data/mock-clients'
import type {
  FlowTemplate,
  FlowStage,
  FormTemplate,
  FormField,
  FieldType,
  ClientFlow,
  FlowType,
  FlowStatus,
} from '@/types/onboarding'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Texto',
  textarea: 'Texto largo',
  select: 'Selección',
  checkbox: 'Casillas',
  file_upload: 'Subir archivo',
  color_picker: 'Color',
  date_picker: 'Fecha',
  rich_text: 'Texto enriquecido',
  number: 'Número',
  email: 'Email',
  url: 'URL',
  phone: 'Teléfono',
}

const allFieldTypes: FieldType[] = [
  'text',
  'textarea',
  'select',
  'checkbox',
  'file_upload',
  'color_picker',
  'date_picker',
  'rich_text',
  'number',
  'email',
  'url',
  'phone',
]

function generateId() {
  return Math.random().toString(36).substring(2, 12)
}

export default function OnboardingPage() {
  const router = useRouter()

  // -- Flows state --
  const [flows, setFlows] = useState<FlowTemplate[]>([...mockFlowTemplates])
  const [stages, setStages] = useState<FlowStage[]>([...mockFlowStages])
  const [flowDialogOpen, setFlowDialogOpen] = useState(false)
  const [deleteFlowDialogOpen, setDeleteFlowDialogOpen] = useState(false)
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [newFlowType, setNewFlowType] = useState<FlowType>('web')

  // -- Forms state --
  const [forms, setForms] = useState<FormTemplate[]>([...mockFormTemplates])
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formSheetOpen, setFormSheetOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null)
  const [newFormName, setNewFormName] = useState('')
  const [newFormDescription, setNewFormDescription] = useState('')
  const [newFormFields, setNewFormFields] = useState<
    Array<{
      id: string
      label: string
      type: FieldType
      required: boolean
      options: string
    }>
  >([])

  // -- Assignments state --
  const [clientFlows, setClientFlows] = useState<ClientFlow[]>([
    ...mockClientFlows,
  ])
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignClientId, setAssignClientId] = useState('')
  const [assignFlowId, setAssignFlowId] = useState('')

  // =========================
  // Flows handlers
  // =========================

  function handleCreateFlow() {
    if (!newFlowName.trim()) {
      toast.error('El nombre del flujo es requerido')
      return
    }
    const newFlow: FlowTemplate = {
      id: `flow-${generateId()}`,
      name: newFlowName.trim(),
      description: newFlowDescription.trim() || undefined,
      type: newFlowType,
      isActive: true,
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setFlows((prev) => [...prev, newFlow])
    setNewFlowName('')
    setNewFlowDescription('')
    setNewFlowType('web')
    setFlowDialogOpen(false)
    toast.success('Flujo creado exitosamente')
  }

  function handleDeleteFlow() {
    if (!flowToDelete) return
    setFlows((prev) => prev.filter((f) => f.id !== flowToDelete))
    setStages((prev) => prev.filter((s) => s.flowTemplateId !== flowToDelete))
    setClientFlows((prev) =>
      prev.filter((cf) => cf.flowTemplateId !== flowToDelete)
    )
    setFlowToDelete(null)
    setDeleteFlowDialogOpen(false)
    toast.success('Flujo eliminado')
  }

  function getStageCount(flowId: string) {
    return stages.filter((s) => s.flowTemplateId === flowId).length
  }

  // =========================
  // Forms handlers
  // =========================

  function addFormField() {
    setNewFormFields((prev) => [
      ...prev,
      {
        id: `field-${generateId()}`,
        label: '',
        type: 'text',
        required: false,
        options: '',
      },
    ])
  }

  function updateFormField(
    index: number,
    updates: Partial<(typeof newFormFields)[0]>
  ) {
    setNewFormFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    )
  }

  function removeFormField(index: number) {
    setNewFormFields((prev) => prev.filter((_, i) => i !== index))
  }

  function handleCreateForm() {
    if (!newFormName.trim()) {
      toast.error('El nombre del formulario es requerido')
      return
    }
    if (newFormFields.length === 0) {
      toast.error('Agrega al menos un campo')
      return
    }
    const hasEmptyLabels = newFormFields.some((f) => !f.label.trim())
    if (hasEmptyLabels) {
      toast.error('Todos los campos deben tener un label')
      return
    }

    const fields: FormField[] = newFormFields.map((f, index) => ({
      id: f.id,
      type: f.type,
      label: f.label.trim(),
      required: f.required,
      order: index,
      ...(f.type === 'select' || f.type === 'checkbox'
        ? {
            options: f.options
              .split('\n')
              .map((o) => o.trim())
              .filter(Boolean),
          }
        : {}),
    }))

    const newForm: FormTemplate = {
      id: `form-${generateId()}`,
      name: newFormName.trim(),
      description: newFormDescription.trim() || undefined,
      schema: { fields },
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setForms((prev) => [...prev, newForm])
    setNewFormName('')
    setNewFormDescription('')
    setNewFormFields([])
    setFormDialogOpen(false)
    toast.success('Formulario creado exitosamente')
  }

  function openFormPreview(form: FormTemplate) {
    setSelectedForm(form)
    setFormSheetOpen(true)
  }

  // =========================
  // Assignments handlers
  // =========================

  function handleAssignFlow() {
    if (!assignClientId || !assignFlowId) {
      toast.error('Selecciona un cliente y un flujo')
      return
    }
    const existing = clientFlows.find(
      (cf) =>
        cf.clientId === assignClientId && cf.flowTemplateId === assignFlowId
    )
    if (existing) {
      toast.error('Este cliente ya tiene asignado este flujo')
      return
    }
    const newAssignment: ClientFlow = {
      id: `cf-${generateId()}`,
      clientId: assignClientId,
      flowTemplateId: assignFlowId,
      status: 'not_started',
      assignedBy: 'admin-1',
      createdAt: new Date().toISOString(),
    }
    setClientFlows((prev) => [...prev, newAssignment])
    setAssignClientId('')
    setAssignFlowId('')
    setAssignDialogOpen(false)
    toast.success('Flujo asignado al cliente')
  }

  function toggleFlowStatus(cfId: string) {
    setClientFlows((prev) =>
      prev.map((cf) => {
        if (cf.id !== cfId) return cf
        const statusCycle: FlowStatus[] = [
          'not_started',
          'in_progress',
          'completed',
        ]
        const currentIndex = statusCycle.indexOf(cf.status)
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]
        return {
          ...cf,
          status: nextStatus,
          ...(nextStatus === 'in_progress'
            ? { startedAt: new Date().toISOString() }
            : {}),
          ...(nextStatus === 'completed'
            ? { completedAt: new Date().toISOString() }
            : { completedAt: undefined }),
        }
      })
    )
  }

  function getClientName(clientId: string) {
    return (
      mockClients.find((c) => c.id === clientId)?.fullName ?? 'Desconocido'
    )
  }

  function getFlowName(flowTemplateId: string) {
    return flows.find((f) => f.id === flowTemplateId)?.name ?? 'Desconocido'
  }

  const statusLabels: Record<FlowStatus, string> = {
    not_started: 'Sin iniciar',
    in_progress: 'En progreso',
    completed: 'Completado',
  }

  const statusColors: Record<FlowStatus, string> = {
    not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground">
          Gestiona flujos, formularios y asignaciones de onboarding
        </p>
      </div>

      <Tabs defaultValue="flujos">
        <TabsList>
          <TabsTrigger value="flujos">
            <Layers className="mr-1.5 h-4 w-4" />
            Flujos
          </TabsTrigger>
          <TabsTrigger value="formularios">
            <FileText className="mr-1.5 h-4 w-4" />
            Formularios
          </TabsTrigger>
          <TabsTrigger value="asignaciones">
            <Users className="mr-1.5 h-4 w-4" />
            Asignaciones
          </TabsTrigger>
        </TabsList>

        {/* ====================== TAB: FLUJOS ====================== */}
        <TabsContent value="flujos">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setFlowDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Flujo
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flows.map((flow) => (
                <Card
                  key={flow.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/admin/onboarding/${flow.id}`)
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{flow.name}</CardTitle>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            flow.type === 'web'
                              ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }
                        >
                          {flow.type === 'web' ? (
                            <Globe className="mr-1 h-3 w-3" />
                          ) : (
                            <Share2 className="mr-1 h-3 w-3" />
                          )}
                          {flow.type === 'web' ? 'Web' : 'Social'}
                        </Badge>
                        <Badge
                          variant={flow.isActive ? 'default' : 'secondary'}
                        >
                          {flow.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {flow.description && (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {flow.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {getStageCount(flow.id)} etapa
                        {getStageCount(flow.id) !== 1 ? 's' : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFlowToDelete(flow.id)
                          setDeleteFlowDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {flows.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No hay flujos creados. Crea tu primer flujo de onboarding.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ====================== TAB: FORMULARIOS ====================== */}
        <TabsContent value="formularios">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setFormDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Formulario
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <Card
                  key={form.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => openFormPreview(form)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{form.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {form.description && (
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                        {form.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {form.schema.fields.length} campo
                        {form.schema.fields.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {forms.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No hay formularios creados.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ====================== TAB: ASIGNACIONES ====================== */}
        <TabsContent value="asignaciones">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setAssignDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Asignar Flujo
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Flujo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de asignación</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Finalización</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientFlows.map((cf) => (
                      <TableRow key={cf.id}>
                        <TableCell className="font-medium">
                          {getClientName(cf.clientId)}
                        </TableCell>
                        <TableCell>{getFlowName(cf.flowTemplateId)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[cf.status]}
                          >
                            {statusLabels[cf.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(cf.createdAt).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          {cf.startedAt
                            ? new Date(cf.startedAt).toLocaleDateString(
                                'es-MX'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {cf.completedAt
                            ? new Date(cf.completedAt).toLocaleDateString(
                                'es-MX'
                              )
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleFlowStatus(cf.id)}
                          >
                            Cambiar estado
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {clientFlows.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No hay asignaciones.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ====================== DIALOG: Nuevo Flujo ====================== */}
      <Dialog open={flowDialogOpen} onOpenChange={setFlowDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Flujo</DialogTitle>
            <DialogDescription>
              Crea un nuevo flujo de onboarding para tus clientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Ej: Onboarding Web Premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                placeholder="Describe el propósito de este flujo..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newFlowType} onValueChange={(v) => setNewFlowType(v as FlowType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">
                    <Globe className="mr-2 inline h-4 w-4" />
                    Web
                  </SelectItem>
                  <SelectItem value="social">
                    <Share2 className="mr-2 inline h-4 w-4" />
                    Social
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlowDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFlow}>Crear Flujo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DIALOG: Confirmar eliminar flujo ====================== */}
      <Dialog open={deleteFlowDialogOpen} onOpenChange={setDeleteFlowDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Flujo</DialogTitle>
            <DialogDescription>
              Esta acción eliminará el flujo, todas sus etapas y las
              asignaciones asociadas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFlowDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFlow}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== DIALOG: Nuevo Formulario ====================== */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Formulario</DialogTitle>
            <DialogDescription>
              Crea un formulario con campos personalizados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del formulario</Label>
              <Input
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="Ej: Información de Marca"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder="Describe el propósito del formulario..."
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Campos</Label>
                <Button variant="outline" size="sm" onClick={addFormField}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agregar Campo
                </Button>
              </div>

              {newFormFields.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No hay campos. Haz clic en &quot;Agregar Campo&quot; para empezar.
                </p>
              )}

              {newFormFields.map((field, index) => (
                <Card key={field.id} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateFormField(index, { label: e.target.value })
                          }
                          placeholder="Nombre del campo"
                        />
                      </div>
                      <div className="w-40 space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            updateFormField(index, { type: v as FieldType })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allFieldTypes.map((ft) => (
                              <SelectItem key={ft} value={ft}>
                                {fieldTypeLabels[ft]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-7">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFormField(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateFormField(index, {
                            required: checked === true,
                          })
                        }
                      />
                      <Label className="text-sm font-normal">Requerido</Label>
                    </div>

                    {(field.type === 'select' || field.type === 'checkbox') && (
                      <div className="space-y-2">
                        <Label>Opciones (una por línea)</Label>
                        <Textarea
                          value={field.options}
                          onChange={(e) =>
                            updateFormField(index, { options: e.target.value })
                          }
                          placeholder={'Opción 1\nOpción 2\nOpción 3'}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateForm}>Crear Formulario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================== SHEET: Form Preview ====================== */}
      <Sheet open={formSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedForm?.name}</SheetTitle>
            {selectedForm?.description && (
              <SheetDescription>{selectedForm.description}</SheetDescription>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {selectedForm?.schema.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div
                    key={field.id}
                    className="rounded-lg border p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{field.label}</span>
                      {field.required && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Requerido
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">
                        {fieldTypeLabels[field.type]}
                      </Badge>
                      {field.placeholder && (
                        <span>Placeholder: {field.placeholder}</span>
                      )}
                    </div>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">
                        {field.helpText}
                      </p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-muted-foreground">
                          Opciones:{' '}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {field.options.map((opt, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ====================== DIALOG: Asignar Flujo ====================== */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Flujo</DialogTitle>
            <DialogDescription>
              Asigna un flujo de onboarding a un cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={assignClientId} onValueChange={(v) => setAssignClientId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients
                    .filter((c) => c.isActive)
                    .map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.fullName}
                        {client.companyName ? ` - ${client.companyName}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Flujo</Label>
              <Select value={assignFlowId} onValueChange={(v) => setAssignFlowId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un flujo" />
                </SelectTrigger>
                <SelectContent>
                  {flows
                    .filter((f) => f.isActive)
                    .map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAssignFlow}>Asignar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
