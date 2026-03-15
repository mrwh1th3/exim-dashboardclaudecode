// Form field types supported by the form builder
export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'file_upload'
  | 'color_picker'
  | 'date_picker'
  | 'rich_text'
  | 'number'
  | 'email'
  | 'url'
  | 'phone'

export interface FieldCondition {
  dependsOn: string // field id
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty'
  value: string
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  customMessage?: string
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  required: boolean
  order: number
  validation?: FieldValidation
  options?: string[] // for select/checkbox
  defaultValue?: string
  conditions?: FieldCondition
}

export interface FormSchema {
  fields: FormField[]
}

export interface FormTemplate {
  id: string
  name: string
  description?: string
  schema: FormSchema
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Pop-up content shown to client at each stage
export interface PopupContent {
  title: string
  body: string
  mediaUrl?: string
}

export type FlowType = 'web' | 'social'

export interface FlowTemplate {
  id: string
  name: string
  description?: string
  type: FlowType
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface FlowStage {
  id: string
  flowTemplateId: string
  name: string
  description?: string
  orderIndex: number
  popupContent?: PopupContent
  dependsOnStageId?: string
  formIds: string[] // form template IDs assigned to this stage
  createdAt: string
}

// Client-specific instances
export type FlowStatus = 'not_started' | 'in_progress' | 'completed'
export type StageStatus = 'locked' | 'available' | 'in_progress' | 'completed'
export type SubmissionStatus = 'draft' | 'submitted' | 'reviewed'

export interface ClientFlow {
  id: string
  clientId: string
  flowTemplateId: string
  status: FlowStatus
  assignedBy: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface ClientStageProgress {
  id: string
  clientFlowId: string
  stageId: string
  status: StageStatus
  completedAt?: string
}

export interface FormSubmission {
  id: string
  clientFlowId: string
  formTemplateId: string
  stageId: string
  data: Record<string, unknown>
  status: SubmissionStatus
  submittedAt?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}
