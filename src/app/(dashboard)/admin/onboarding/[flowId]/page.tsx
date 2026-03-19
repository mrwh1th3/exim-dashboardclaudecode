'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Globe,
  Share2,
  Eye,
  Link2,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { createClient } from '@/lib/supabase/client'
import type {
  FlowTemplate,
  FlowStage,
  FormTemplate,
  FlowType,
} from '@/types/onboarding'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
import { ScrollArea } from '@/components/ui/scroll-area'

interface FlowEditorPageProps {
  params: Promise<{ flowId: string }>
}

function generateId() {
  return Math.random().toString(36).substring(2, 12)
}

// ========================
// Sortable Stage Card
// ========================

interface SortableStageProps {
  stage: FlowStage
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<FlowStage>) => void
  onDelete: () => void
  allStages: FlowStage[]
  allForms: FormTemplate[]
}

function SortableStageCard({
  stage,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  allStages,
  allForms,
}: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const otherStages = allStages.filter((s) => s.id !== stage.id)
  const dependsOn = stage.dependsOnStageId
    ? allStages.find((s) => s.id === stage.dependsOnStageId)
    : null
  const dependents = allStages.filter((s) => s.dependsOnStageId === stage.id)

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'ring-2 ring-primary' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <Input
                value={stage.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="font-semibold text-base border-none px-0 shadow-none focus-visible:ring-0 h-auto"
                placeholder="Nombre de la etapa"
              />
            </div>
            {dependsOn && (
              <Badge variant="outline" className="text-xs gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                <Link2 className="h-3 w-3" />
                Requiere: {dependsOn.name}
              </Badge>
            )}
            {dependents.length > 0 && (
              <Badge variant="outline" className="text-xs gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                {dependents.length} dependiente{dependents.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              Orden: {stage.orderIndex + 1}
            </Badge>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4 pt-2">
            {/* Description */}
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={stage.description || ''}
                onChange={(e) =>
                  onUpdate({ description: e.target.value || undefined })
                }
                placeholder="Describe esta etapa..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Popup content */}
            <div className="space-y-3">
              <Label className="text-base">Popup de bienvenida</Label>
              <div className="space-y-2">
                <Label className="text-sm">Título del popup</Label>
                <Input
                  value={stage.popupContent?.title || ''}
                  onChange={(e) =>
                    onUpdate({
                      popupContent: {
                        title: e.target.value,
                        body: stage.popupContent?.body || '',
                        mediaUrl: stage.popupContent?.mediaUrl,
                      },
                    })
                  }
                  placeholder="Título del popup..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Cuerpo del popup</Label>
                <Textarea
                  value={stage.popupContent?.body || ''}
                  onChange={(e) =>
                    onUpdate({
                      popupContent: {
                        title: stage.popupContent?.title || '',
                        body: e.target.value,
                        mediaUrl: stage.popupContent?.mediaUrl,
                      },
                    })
                  }
                  placeholder="Contenido del popup..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Form assignments */}
            <div className="space-y-3">
              <Label className="text-base">Formularios asignados</Label>
              <div className="space-y-2">
                {allForms.map((form) => {
                  const isAssigned = stage.formIds.includes(form.id)
                  return (
                    <div
                      key={form.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onUpdate({
                              formIds: [...stage.formIds, form.id],
                            })
                          } else {
                            onUpdate({
                              formIds: stage.formIds.filter(
                                (id) => id !== form.id
                              ),
                            })
                          }
                        }}
                      />
                      <Label className="text-sm font-normal">
                        {form.name}
                        {form.description && (
                          <span className="ml-1 text-muted-foreground">
                            - {form.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  )
                })}
                {allForms.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay formularios disponibles. Crea uno desde la pestaña
                    de formularios.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Dependency */}
            <div className="space-y-2">
              <Label>Dependencia (etapa previa requerida)</Label>
              <Select
                value={stage.dependsOnStageId || '__none__'}
                onValueChange={(v) =>
                  onUpdate({
                    dependsOnStageId:
                      !v || v === '__none__' ? undefined : v,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin dependencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin dependencia</SelectItem>
                  {otherStages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Delete */}
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar etapa
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// ========================
// Main Page Component
// ========================

export default function FlowEditorPage({ params }: FlowEditorPageProps) {
  const { flowId } = use(params)

  const [flow, setFlow] = useState<FlowTemplate | null>(null)
  const [stages, setStages] = useState<FlowStage[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewStageIndex, setPreviewStageIndex] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const [{ data: flowData }, { data: stagesData }, { data: formsData }] = await Promise.all([
        supabase.from('flow_templates').select('*').eq('id', flowId).single(),
        supabase.from('flow_stages').select('*').eq('flow_template_id', flowId).order('order_index', { ascending: true }),
        supabase.from('form_templates').select('*').order('created_at', { ascending: true }),
      ])
      if (flowData) {
        setFlow({
          id: flowData.id,
          name: flowData.name,
          description: flowData.description ?? '',
          type: flowData.type,
          isActive: flowData.is_active,
          createdBy: flowData.created_by,
          createdAt: flowData.created_at,
          updatedAt: flowData.updated_at,
        })
        setStages((stagesData ?? []).map((s: any) => ({
          id: s.id,
          flowTemplateId: s.flow_template_id,
          name: s.name,
          description: s.description ?? '',
          orderIndex: s.order_index,
          popupContent: s.popup_content ?? undefined,
          dependsOnStageId: s.depends_on_stage_id ?? undefined,
          formIds: s.form_ids ?? [],
          createdAt: s.created_at,
        })))
      }
      setForms((formsData ?? []).map((f: any) => ({
        id: f.id,
        name: f.name,
        description: f.description ?? '',
        schema: f.schema,
        createdBy: f.created_by,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })))
      setLoading(false)
    })()
  }, [flowId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  // -- Loading --
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando flujo...</p>
      </div>
    )
  }

  // -- Flow not found --
  if (!flow) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold">Flujo no encontrado</h1>
        <p className="text-muted-foreground mt-2">
          El flujo solicitado no existe.
        </p>
        <Link href="/admin/onboarding">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a onboarding
          </Button>
        </Link>
      </div>
    )
  }

  // -- Handlers --

  function updateFlow(updates: Partial<FlowTemplate>) {
    setFlow((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  function toggleExpand(stageId: string) {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(stageId)) {
        next.delete(stageId)
      } else {
        next.add(stageId)
      }
      return next
    })
  }

  function updateStage(stageId: string, updates: Partial<FlowStage>) {
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
    )
  }

  async function deleteStage(stageId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('flow_stages').delete().eq('id', stageId)
    if (error) {
      toast.error('Error al eliminar la etapa')
      return
    }
    setStages((prev) => {
      const filtered = prev.filter((s) => s.id !== stageId)
      return filtered.map((s, i) => ({
        ...s,
        orderIndex: i,
        dependsOnStageId: s.dependsOnStageId === stageId ? undefined : s.dependsOnStageId,
      }))
    })
    toast.success('Etapa eliminada')
  }

  async function addStage() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('flow_stages')
      .insert({
        flow_template_id: flowId,
        name: 'Nueva Etapa',
        description: '',
        order_index: stages.length,
        form_ids: [],
      })
      .select()
      .single()
    if (error || !data) {
      toast.error('Error al crear la etapa')
      return
    }
    const newStage: FlowStage = {
      id: data.id,
      flowTemplateId: flowId,
      name: data.name,
      description: data.description ?? '',
      orderIndex: data.order_index,
      formIds: data.form_ids ?? [],
      createdAt: data.created_at,
    }
    setStages((prev) => [...prev, newStage])
    setExpandedStages((prev) => new Set(prev).add(newStage.id))
    toast.success('Etapa creada')
  }

  async function handleSave() {
    if (!flow) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: flowError } = await supabase
        .from('flow_templates')
        .update({
          name: flow.name,
          description: flow.description || null,
          is_active: flow.isActive,
        })
        .eq('id', flowId)
      if (flowError) throw flowError

      for (const stage of stages) {
        const { error: stageError } = await supabase
          .from('flow_stages')
          .update({
            name: stage.name,
            description: stage.description || null,
            order_index: stage.orderIndex,
            popup_content: stage.popupContent ?? null,
            depends_on_stage_id: stage.dependsOnStageId ?? null,
            form_ids: stage.formIds,
          })
          .eq('id', stage.id)
        if (stageError) throw stageError
      }

      toast.success('Cambios guardados')
    } catch {
      toast.error('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setStages((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      return reordered.map((s, i) => ({ ...s, orderIndex: i }))
    })
  }

  // -- Preview --

  const previewStages = stages.sort((a, b) => a.orderIndex - b.orderIndex)
  const currentPreviewStage = previewStages[previewStageIndex]

  function getFormById(formId: string) {
    return forms.find((f) => f.id === formId)
  }

  const fieldTypeLabels: Record<string, string> = {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/onboarding">
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Input
              value={flow.name}
              onChange={(e) => updateFlow({ name: e.target.value })}
              className="text-2xl font-bold border-none px-0 shadow-none focus-visible:ring-0 h-auto"
              placeholder="Nombre del flujo"
            />
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
          </div>
          <Input
            value={flow.description || ''}
            onChange={(e) =>
              updateFlow({ description: e.target.value || undefined })
            }
            className="text-sm text-muted-foreground border-none px-0 shadow-none focus-visible:ring-0 h-auto"
            placeholder="Descripción del flujo..."
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Activo</Label>
            <Switch
              checked={flow.isActive}
              onCheckedChange={(checked) =>
                updateFlow({ isActive: checked === true })
              }
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (stages.length === 0) {
                toast.error('Agrega al menos una etapa para ver el preview')
                return
              }
              setPreviewStageIndex(0)
              setPreviewOpen(true)
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Etapas ({stages.length})
          </h2>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {stages
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((stage, idx) => (
                  <div key={stage.id}>
                    <SortableStageCard
                      stage={stage}
                      isExpanded={expandedStages.has(stage.id)}
                      onToggleExpand={() => toggleExpand(stage.id)}
                      onUpdate={(updates) => updateStage(stage.id, updates)}
                      onDelete={() => deleteStage(stage.id)}
                      allStages={stages}
                      allForms={forms}
                    />
                    {idx < stages.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </SortableContext>
        </DndContext>

        {stages.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No hay etapas. Agrega tu primera etapa para este flujo.
          </div>
        )}

        <Button onClick={addStage} className="w-full" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Etapa
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview del Flujo</DialogTitle>
            <DialogDescription>
              Simula la experiencia del cliente paso a paso
            </DialogDescription>
          </DialogHeader>

          {currentPreviewStage && (
            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* Progress indicator */}
                <div className="flex items-center gap-1.5">
                  {previewStages.map((s, i) => (
                    <div
                      key={s.id}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= previewStageIndex
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Etapa {previewStageIndex + 1} de {previewStages.length}
                </div>

                {/* Popup section */}
                {currentPreviewStage.popupContent && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {currentPreviewStage.popupContent.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {currentPreviewStage.popupContent.body}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Stage info */}
                <div>
                  <h3 className="font-semibold text-lg">
                    {currentPreviewStage.name}
                  </h3>
                  {currentPreviewStage.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentPreviewStage.description}
                    </p>
                  )}
                  {currentPreviewStage.dependsOnStageId && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Link2 className="h-3 w-3" />
                      Requiere completar: {previewStages.find((s) => s.id === currentPreviewStage.dependsOnStageId)?.name ?? 'etapa previa'}
                    </div>
                  )}
                </div>

                {/* Forms */}
                {currentPreviewStage.formIds.length > 0 ? (
                  currentPreviewStage.formIds.map((formId) => {
                    const form = getFormById(formId)
                    if (!form) return null
                    return (
                      <Card key={formId}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {form.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {form.schema.fields
                            .sort((a, b) => a.order - b.order)
                            .map((field) => (
                              <div key={field.id} className="space-y-1">
                                <Label className="text-sm">
                                  {field.label}
                                  {field.required && (
                                    <span className="ml-1 text-destructive">
                                      *
                                    </span>
                                  )}
                                </Label>
                                {field.helpText && (
                                  <p className="text-xs text-muted-foreground">
                                    {field.helpText}
                                  </p>
                                )}
                                {/* Simulated field rendering */}
                                {(field.type === 'text' ||
                                  field.type === 'email' ||
                                  field.type === 'url' ||
                                  field.type === 'phone' ||
                                  field.type === 'number') && (
                                  <Input
                                    placeholder={
                                      field.placeholder || field.label
                                    }
                                    disabled
                                  />
                                )}
                                {(field.type === 'textarea' ||
                                  field.type === 'rich_text') && (
                                  <Textarea
                                    placeholder={
                                      field.placeholder || field.label
                                    }
                                    disabled
                                    rows={3}
                                  />
                                )}
                                {field.type === 'select' &&
                                  field.options && (
                                    <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                                      {field.options.join(' / ')}
                                    </div>
                                  )}
                                {field.type === 'checkbox' &&
                                  field.options && (
                                    <div className="space-y-1">
                                      {field.options.map((opt) => (
                                        <div
                                          key={opt}
                                          className="flex items-center gap-2"
                                        >
                                          <Checkbox disabled />
                                          <span className="text-sm text-muted-foreground">
                                            {opt}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                {field.type === 'file_upload' && (
                                  <div className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                                    Subir archivo
                                  </div>
                                )}
                                {field.type === 'color_picker' && (
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded border bg-muted" />
                                    <span className="text-sm text-muted-foreground">
                                      Seleccionar color
                                    </span>
                                  </div>
                                )}
                                {field.type === 'date_picker' && (
                                  <Input
                                    placeholder="dd/mm/aaaa"
                                    disabled
                                  />
                                )}
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Esta etapa no tiene formularios asignados.
                  </p>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={previewStageIndex === 0}
              onClick={() =>
                setPreviewStageIndex((prev) => Math.max(0, prev - 1))
              }
            >
              Anterior
            </Button>
            {previewStageIndex < previewStages.length - 1 ? (
              <Button
                onClick={() =>
                  setPreviewStageIndex((prev) =>
                    Math.min(previewStages.length - 1, prev + 1)
                  )
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button onClick={() => setPreviewOpen(false)}>
                Finalizar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
