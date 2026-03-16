export type WebPageStatus = 'draft' | 'in_development' | 'review' | 'published' | 'maintenance'

export interface WebPage {
  id: string
  clientId: string
  clientName: string
  url?: string
  domain?: string
  status: WebPageStatus
  lastDeployedAt?: string
  sslExpiry?: string
  planId?: string
  createdAt: string
  updatedAt: string
}

export interface WebPageChange {
  id: string
  webPageId: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  requestId?: string
  createdAt: string
  completedAt?: string
}
