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
