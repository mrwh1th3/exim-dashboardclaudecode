export type SubscriptionInterval = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  interval: SubscriptionInterval
  features: string[]
  isActive: boolean
  stripePriceId?: string
  createdAt: string
}

export interface ClientSubscription {
  id: string
  clientId: string
  planId: string
  status: SubscriptionStatus
  stripeSubscriptionId?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  createdAt: string
  updatedAt: string
}

export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'void'

export interface Invoice {
  id: string
  clientId: string
  subscriptionId: string
  amount: number
  currency: string
  status: InvoiceStatus
  stripeInvoiceId?: string
  periodStart: string
  periodEnd: string
  paidAt?: string
  createdAt: string
}

export interface RevenueMetrics {
  mrr: number
  activeSubscriptions: number
  totalRevenue: number
  growth: number
  churnRate: number
}
