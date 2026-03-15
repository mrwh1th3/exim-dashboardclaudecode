export type Platform = 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin'
export type PostStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'rejected'

export interface SocialPost {
  id: string
  clientId: string
  clientName: string
  title?: string
  content: string
  mediaUrls: string[]
  platforms: Platform[]
  scheduledDate?: string // YYYY-MM-DD
  scheduledTime?: string // HH:mm
  status: PostStatus
  approvedBy?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SocialStrategy {
  id: string
  clientId: string
  clientName: string
  title: string
  content: string // rich text HTML
  createdBy: string
  createdAt: string
  updatedAt: string
}
