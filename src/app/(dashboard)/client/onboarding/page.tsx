'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useFlowsStore } from '@/stores/flows-store'
import { FlowStage, ClientStageProgress, FormTemplate, FormField } from '@/types/onboarding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Check, Lock, Circle, AlertCircle, FileText } from 'lucide-react'
import { ShimmerButton } from '@/components/ui/shimmer-button'

export default function ClientOnboardingPage() {
  const { user } = useAuthStore()
  const {
    clientFlows,
    flowTemplates,
    flowStages,
    clientStageProgress: allProgress,
    formTemplates,
    formSubmissions,
    saveFormSubmission,
    updateStageProgress,
    updateClientFlowStatus,
  } = useFlowsStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<FlowStage | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const clientFlow = useMemo(() => {
    return clientFlows.find((f) => f.clientId === user?.id)
  }, [clientFlows, user?.id])

  const flowTemplate = useMemo(() => {
    if (!clientFlow) return null
    return flowTemplates.find((t) => t.id === clientFlow.flowTemplateId) ?? null
  }, [clientFlow, flowTemplates])

  const stages = useMemo(() => {
    if (!flowTemplate) return []
    return flowStages
      .filter((s) => s.flowTemplateId === flowTemplate.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [flowTemplate, flowStages])

  const stageProgress = useMemo(() => {
    if (!clientFlow) return new Map<string, ClientStageProgress>()
    const map = new Map<string, ClientStageProgress>()
    allProgress
      .filter((p) => p.clientFlowId === clientFlow.id)
      .forEach((p) => map.set(p.stageId, p))
    return map
  }, [clientFlow, allProgress])

  const getStageStatus = (stage: FlowStage) => {
    const progress = stageProgress.get(stage.id)
    if (progress) return progress.status
    // If no progress record, determine based on dependencies
    if (!stage.dependsOnStageId) return 'available'
    const depProgress = stageProgress.get(stage.dependsOnStageId)
    if (depProgress?.status === 'completed') return 'available'
    return 'locked'
  }

  const handleStageClick = (stage: FlowStage) => {
    const status = getStageStatus(stage)
    if (status === 'locked') return
    setSelectedStage(stage)
    setDialogOpen(true)
  }

  const handleOpenForm = (formId: string) => {
    const form = formTemplates.find((f) => f.id === formId)
    if (form && clientFlow && selectedStage) {
      // Pre-fill with existing submission data if available
      const existing = formSubmissions.find(
        (s) => s.clientFlowId === clientFlow.id && s.formTemplateId === formId && s.stageId === selectedStage.id
      )
      setFormData(existing?.data ?? {})
      setSelectedForm(form)
      setDialogOpen(false)
      setSheetOpen(true)
    }
  }

  const handleSubmitForm = () => {
    if (!clientFlow || !selectedStage || !selectedForm) return
    saveFormSubmission({
      id: `sub-${Date.now()}`,
      clientFlowId: clientFlow.id,
      formTemplateId: selectedForm.id,
      stageId: selectedStage.id,
      data: formData,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    // Mark stage as in_progress if not already completed
    const currentStatus = stageProgress.get(selectedStage.id)?.status
    if (currentStatus !== 'completed') {
      updateStageProgress(clientFlow.id, selectedStage.id, 'in_progress')
    }
    // Mark flow as in_progress if not started
    if (clientFlow.status === 'not_started') {
      updateClientFlowStatus(clientFlow.id, 'in_progress')
    }
    toast.success('Formulario enviado exitosamente')
    setSheetOpen(false)
    setSelectedForm(null)
    setFormData({})
  }

  const updateField = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const renderFormField = (field: FormField) => {
    const value = formData[field.id]
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            onChange={(e) => updateField(field.id, e.target.value)}
          />
        )
      case 'number':
        return <Input type="number" placeholder={field.placeholder} value={(value as string) ?? ''} onChange={(e) => updateField(field.id, e.target.value)} />
      case 'textarea':
      case 'rich_text':
        return <Textarea placeholder={field.placeholder} rows={4} value={(value as string) ?? ''} onChange={(e) => updateField(field.id, e.target.value)} />
      case 'select':
        return (
          <Select value={(value as string) ?? ''} onValueChange={(v) => updateField(field.id, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => {
              const checked = Array.isArray(value) ? (value as string[]).includes(opt) : false
              return (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const current = Array.isArray(value) ? (value as string[]) : []
                      updateField(field.id, c ? [...current, opt] : current.filter((v) => v !== opt))
                    }}
                  />
                  <span>{opt}</span>
                </label>
              )
            })}
          </div>
        )
      case 'file_upload':
        return <Input type="file" className="cursor-pointer" />
      case 'color_picker':
        return <Input type="color" className="h-10 w-20 p-1 cursor-pointer" value={(value as string) ?? '#000000'} onChange={(e) => updateField(field.id, e.target.value)} />
      case 'date_picker':
        return <Input type="date" value={(value as string) ?? ''} onChange={(e) => updateField(field.id, e.target.value)} />
      default:
        return <Input placeholder={field.placeholder} value={(value as string) ?? ''} onChange={(e) => updateField(field.id, e.target.value)} />
    }
  }

  if (!clientFlow || !flowTemplate) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No tienes un flujo de onboarding asignado</h2>
        <p className="text-muted-foreground">Contacta a tu administrador para comenzar el proceso.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{flowTemplate.name}</h2>
        {flowTemplate.description && (
          <p className="text-muted-foreground">{flowTemplate.description}</p>
        )}
      </div>

      {/* Vertical Step Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso</CardTitle>
          <CardDescription>Completa cada etapa para avanzar en tu proceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage)
              const isLast = index === stages.length - 1

              return (
                <div key={stage.id} className="flex gap-4">
                  {/* Connector line + icon */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleStageClick(stage)}
                      disabled={status === 'locked'}
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        status === 'completed'
                          ? 'border-green-500 bg-green-500 text-white'
                          : status === 'in_progress'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : status === 'available'
                          ? 'border-primary bg-background text-primary cursor-pointer hover:bg-primary/10'
                          : 'border-muted-foreground/30 bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : status === 'in_progress' ? (
                        <Circle className="h-5 w-5 animate-pulse" />
                      ) : status === 'locked' ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[40px] ${
                          status === 'completed' ? 'bg-green-500' : 'bg-muted-foreground/20'
                        }`}
                      />
                    )}
                  </div>

                  {/* Stage content */}
                  <div className="pb-8 flex-1 pt-1.5">
                    <button
                      onClick={() => handleStageClick(stage)}
                      disabled={status === 'locked'}
                      className={`text-left w-full ${
                        status === 'locked' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <h4 className="font-medium">{stage.name}</h4>
                      {stage.description && (
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      )}
                      <span
                        className={`inline-block mt-1 text-xs font-medium ${
                          status === 'completed'
                            ? 'text-green-600'
                            : status === 'in_progress'
                            ? 'text-blue-600'
                            : status === 'available'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {status === 'completed'
                          ? 'Completado'
                          : status === 'in_progress'
                          ? 'En progreso'
                          : status === 'available'
                          ? 'Disponible'
                          : 'Bloqueado'}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedStage && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedStage.popupContent?.title ?? selectedStage.name}
                </DialogTitle>
                {selectedStage.popupContent?.body && (
                  <DialogDescription>{selectedStage.popupContent.body}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {selectedStage.formIds.length > 0 ? (
                  <>
                    <h4 className="text-sm font-medium">Formularios de esta etapa:</h4>
                    {selectedStage.formIds.map((formId) => {
                      const form = formTemplates.find((f) => f.id === formId)
                      if (!form) return null
                      const submission = clientFlow ? formSubmissions.find(
                        (s) => s.clientFlowId === clientFlow.id && s.formTemplateId === formId && s.stageId === selectedStage.id
                      ) : null
                      return (
                        <div
                          key={formId}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`h-5 w-5 ${submission ? 'text-green-500' : 'text-muted-foreground'}`} />
                            <div>
                              <p className="text-sm font-medium">{form.name}</p>
                              {form.description && (
                                <p className="text-xs text-muted-foreground">{form.description}</p>
                              )}
                              {submission && (
                                <p className="text-xs text-green-600">Enviado</p>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant={submission ? 'outline' : 'default'} onClick={() => handleOpenForm(formId)}>
                            {submission ? 'Editar' : 'Completar'}
                          </Button>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Esta etapa no tiene formularios asignados. Tu administrador se pondrá en contacto contigo.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedForm && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedForm.name}</SheetTitle>
                {selectedForm.description && (
                  <SheetDescription>{selectedForm.description}</SheetDescription>
                )}
              </SheetHeader>
              <div className="mt-6 space-y-5">
                {selectedForm.schema.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderFormField(field)}
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                <ShimmerButton
                  onClick={handleSubmitForm}
                  background="rgba(216,98,38,0.9)"
                  shimmerColor="#ffffff"
                  borderRadius="8px"
                  className="w-full justify-center"
                >
                  Enviar formulario
                </ShimmerButton>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
