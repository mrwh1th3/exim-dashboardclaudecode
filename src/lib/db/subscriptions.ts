import { createClient } from '@/lib/supabase/server'
import {
  SubscriptionPlan,
  ClientSubscription,
  Invoice,
  RevenueMetrics,
} from '@/types/subscriptions'

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: row.price,
    currency: row.currency,
    interval: row.interval,
    features: row.features ?? [],
    isActive: row.is_active,
    stripePriceId: row.stripe_price_id ?? undefined,
    createdAt: row.created_at,
  }))
}

export async function getClientSubscriptions(clientId?: string): Promise<ClientSubscription[]> {
  const supabase = await createClient()
  let query = supabase
    .from('client_subscriptions')
    .select('*, profiles(full_name, email), subscription_plans(name, price, currency, interval, features)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string })?.full_name ?? '',
    planId: row.plan_id,
    plan: row.subscription_plans as SubscriptionPlan,
    status: row.status,
    stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
    currentPeriodStart: row.current_period_start ?? '',
    currentPeriodEnd: row.current_period_end ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getInvoices(clientId?: string): Promise<Invoice[]> {
  const supabase = await createClient()
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    subscriptionId: row.subscription_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    stripeInvoiceId: row.stripe_invoice_id ?? undefined,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
  }))
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = await createClient()

  const { data: activeSubs } = await supabase
    .from('client_subscriptions')
    .select('plan_id, subscription_plans(price)')
    .eq('status', 'active')

  const mrr = (activeSubs ?? []).reduce((sum, sub) => {
    const plan = sub.subscription_plans as unknown as { price: number } | null
    return sum + (plan?.price ?? 0)
  }, 0)

  const { count: activeCount } = await supabase
    .from('client_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('amount')
    .eq('status', 'paid')

  const totalRevenue = (paidInvoices ?? []).reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  return {
    mrr,
    activeSubscriptions: activeCount ?? 0,
    totalRevenue,
    growth: 0,
    churnRate: 0,
  }
}

export async function upsertSubscription(data: {
  clientId: string
  planId: string
  status: string
  stripeSubscriptionId: string
  currentPeriodStart: string
  currentPeriodEnd: string
}): Promise<void> {
  const supabase = await createClient()
  await supabase.from('client_subscriptions').upsert({
    client_id: data.clientId,
    plan_id: data.planId,
    status: data.status,
    stripe_subscription_id: data.stripeSubscriptionId,
    current_period_start: data.currentPeriodStart,
    current_period_end: data.currentPeriodEnd,
  }, { onConflict: 'stripe_subscription_id' })
}
