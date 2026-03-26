import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpsert(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await adminClient
          .from('client_subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        await handleInvoicePaid(invoice)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        if (invoice.id) {
          await adminClient
            .from('invoices')
            .update({ status: 'failed' })
            .eq('stripe_invoice_id', invoice.id)
        }
        // Also mark subscription as past_due
        if (invoice.subscription) {
          await adminClient
            .from('client_subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription & { current_period_start?: number; current_period_end?: number }) {
  const customerId = subscription.customer as string

  // Find the profile by stripe_customer_id
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) return

  // Find matching plan
  const { data: plan } = await adminClient
    .from('subscription_plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single()

  if (!plan) return

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',
    incomplete: 'pending',
    incomplete_expired: 'cancelled',
    unpaid: 'past_due',
    trialing: 'active',
  }

  const newStatus = statusMap[subscription.status] ?? 'inactive'

  // First, check if there's already a subscription with this stripe_subscription_id
  const { data: existingByStripe } = await adminClient
    .from('client_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (existingByStripe) {
    // Update existing subscription
    await adminClient
      .from('client_subscriptions')
      .update({
        status: newStatus,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })
      .eq('id', existingByStripe.id)
    return
  }

  // Check if there's a pending subscription for this client + plan (waiting for payment)
  const { data: pendingSub } = await adminClient
    .from('client_subscriptions')
    .select('id')
    .eq('client_id', profile.id)
    .eq('plan_id', plan.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingSub) {
    // Activate the pending subscription and link it to Stripe
    await adminClient
      .from('client_subscriptions')
      .update({
        status: newStatus,
        stripe_subscription_id: subscription.id,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })
      .eq('id', pendingSub.id)
  } else {
    // No pending subscription - create a new one
    await adminClient.from('client_subscriptions').insert({
      client_id: profile.id,
      plan_id: plan.id,
      status: newStatus,
      stripe_subscription_id: subscription.id,
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Get metadata from session
  const clientId = session.metadata?.client_id
  const planId = session.metadata?.plan_id
  const subscriptionId = session.subscription as string | null

  if (!clientId || !planId || !subscriptionId) return

  // Find the pending subscription for this client and plan
  const { data: pendingSub } = await adminClient
    .from('client_subscriptions')
    .select('id')
    .eq('client_id', clientId)
    .eq('plan_id', planId)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingSub) {
    // Activate the pending subscription and link it to Stripe
    await adminClient
      .from('client_subscriptions')
      .update({
        status: 'active',
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', pendingSub.id)
  } else {
    // No pending subscription found - the handleSubscriptionUpsert will create it
    // This handles the case where checkout was done without a pending subscription
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice & { subscription?: string | null }) {
  const customerId = invoice.customer as string

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile || !invoice.subscription) return

  const { data: sub } = await adminClient
    .from('client_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!sub) return

  await adminClient.from('invoices').upsert({
    client_id: profile.id,
    subscription_id: sub.id,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    status: 'paid',
    stripe_invoice_id: invoice.id,
    period_start: new Date((invoice.period_start ?? Date.now() / 1000) * 1000).toISOString(),
    period_end: new Date((invoice.period_end ?? Date.now() / 1000) * 1000).toISOString(),
    paid_at: new Date().toISOString(),
  }, { onConflict: 'stripe_invoice_id' })
}
