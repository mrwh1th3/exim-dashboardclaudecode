export type RequestType = 'page_change' | 'product'
export type UrgencyLevel = 'normal' | 'urgent'

export interface RequestStatus {
  id: string
  name: string
  color: string // hex color
  orderIndex: number
  isDefault: boolean
  createdAt: string
}

export interface RequestAttachment {
  id: string
  requestId: string
  fileUrl: string
  fileName: string
  fileType?: string
  fileSize?: number
  createdAt: string
}

export interface Request {
  id: string
  clientId: string
  clientName: string // denormalized for display
  type: RequestType
  statusId: string
  urgency?: UrgencyLevel
  // Page change fields
  pageSection?: string
  changeDescription?: string
  // Product fields
  productTitle?: string
  productPrice?: number
  productCategory?: string
  productDescription?: string
  implementationDescription?: string
  // Common
  attachments: RequestAttachment[]
  adminNotes?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
}
