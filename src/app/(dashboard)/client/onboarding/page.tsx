'use client'

import { useState, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  mockClientFlows,
  mockFlowTemplates,
  mockFlowStages,
  mockClientStageProgress,
  mockFormTemplates,
} from '@/data/mock-flows'
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

export default function ClientOnboardingPage() {
  const { user } = useAuthStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<FlowStage | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null)

  const clientFlow = useMemo(() => {
    return mockClientFlows.find((f) => f.clientId === user?.id)
  }, [user?.id])

  const flowTemplate = useMemo(() => {
    if (!clientFlow) return null
    return mockFlowTemplates.find((t) => t.id === clientFlow.flowTemplateId) ?? null
  }, [clientFlow])

  const stages = useMemo(() => {
    if (!flowTemplate) return []
    return mockFlowStages
      .filter((s) => s.flowTemplateId === flowTemplate.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [flowTemplate])

  const stageProgress = useMemo(() => {
    if (!clientFlow) return new Map<string, ClientStageProgress>()
    const map = new Map<string, ClientStageProgress>()
    mockClientStageProgress
      .filter((p) => p.clientFlowId === clientFlow.id)
      .forEach((p) => map.set(p.stageId, p))
    return map
  }, [clientFlow])

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
    const form = mockFormTemplates.find((f) => f.id === formId)
    if (form) {
      setSelectedForm(form)
      setDialogOpen(false)
      setSheetOpen(true)
    }
  }

  const handleSubmitForm = () => {
    toast.success('Formulario enviado')
    setSheetOpen(false)
    setSelectedForm(null)
  }

  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <Input
            type={field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
          />
        )
      case 'number':
        return <Input type="number" placeholder={field.placeholder} />
      case 'textarea':
      case 'rich_text':
        return <Textarea placeholder={field.placeholder} rows={4} />
      case 'select':
        return (
          <Select>
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
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <Checkbox />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'file_upload':
        return <Input type="file" className="cursor-pointer" />
      case 'color_picker':
        return <Input type="color" className="h-10 w-20 p-1 cursor-pointer" />
      case 'date_picker':
        return <Input type="date" />
      default:
        return <Input placeholder={field.placeholder} />
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
                      const form = mockFormTemplates.find((f) => f.id === formId)
                      if (!form) return null
                      return (
                        <div
                          key={formId}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{form.name}</p>
                              {form.description && (
                                <p className="text-xs text-muted-foreground">{form.description}</p>
                              )}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleOpenForm(formId)}>
                            Completar formulario
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
                <Button onClick={handleSubmitForm} className="w-full">
                  Enviar formulario
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
