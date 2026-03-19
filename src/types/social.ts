export type Platform = 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin'

export type PostType = 'post' | 'story'

export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'max_rounds_reached'
  | 'approved'
  | 'scheduled'
  | 'published'
  // legacy alias kept for backward compat
  | 'pending_approval'
  | 'rejected'

export type StrategyStatus =
  | 'draft'
  | 'sent_for_review'
  | 'adjustments_requested'
  | 'approved'
  | 'calendar_active'
  | 'closed'

export interface SocialPost {
  id: string
  clientId: string
  clientName: string
  type: PostType
  title?: string
  content: string
  mediaUrls: string[]
  platforms: Platform[]
  scheduledDate?: string // YYYY-MM-DD
  scheduledTime?: string // HH:mm
  status: PostStatus
  changeRounds: number
  maxRounds: number
  canvaDesignId?: string
  approvedBy?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PostFeedback {
  id: string
  postId: string
  clientId: string
  authorRole: string
  message: string
  roundNumber: number
  status: 'open' | 'resolved'
  createdAt: string
}

export interface SocialStrategy {
  id: string
  clientId: string
  clientName: string
  title: string
  content: string // rich text HTML
  status: StrategyStatus
  bimesterStart?: string // YYYY-MM-DD
  bimesterEnd?: string // YYYY-MM-DD
  approvedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SocialAccount {
  id: string
  tenantId: string // = client profile id
  network: Platform
  accountId: string
  accountName?: string
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarLogEntry {
  id: string
  postId: string
  changedBy: string
  changedByName?: string
  oldScheduledDate?: string
  oldScheduledTime?: string
  newScheduledDate?: string
  newScheduledTime?: string
  changedAt: string
}

export interface BrandGuideline {
  id: string
  clientId: string
  clientName?: string
  // Typography
  primaryFont?: string
  primaryFontStyle?: string
  secondaryFont?: string
  secondaryFontStyle?: string
  // Colors
  colors: BrandColor[]
  // Voice
  tone?: 'formal' | 'neutral' | 'casual'
  personality: string[] // up to 3 words
  avoidTopics: string[]
  approvedEmojis: string[]
  clientTreatment?: 'tu' | 'usted'
  // Rules
  safeZones?: string
  logoRules?: string
  photoStyle?: string
  dosList: string[]
  dontsList: string[]
  updatedAt: string
  createdAt: string
}

export interface BrandColor {
  name: string
  hex: string
  usage?: string // e.g. "Primary background"
}
