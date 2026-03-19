import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST() {
  try {
    const adminClient = getAdminClient()

    // Fetch ALL Stripe subscriptions (paginate)
    const allSubs: Stripe.Subscription[] = []
    let hasMore = true
    let startingAfter: string | undefined
    while (hasMore) {
      const batch = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.customer'],
      })
      allSubs.push(...batch.data)
      hasMore = batch.has_more
      startingAfter = batch.data[batch.data.length - 1]?.id
    }

    // Load local plans and client profiles
    const [{ data: localPlans }, { data: profiles }] = await Promise.all([
      adminClient.from('subscription_plans').select('id, stripe_price_id'),
      adminClient.from('profiles').select('id, stripe_customer_id, email').eq('role', 'client'),
    ])

    const planByPriceId = new Map(
      (localPlans ?? [])
        .filter((p) => p.stripe_price_id)
        .map((p) => [p.stripe_price_id as string, p.id as string])
    )
    const profileByCustomerId = new Map(
      (profiles ?? [])
        .filter((p) => p.stripe_customer_id)
        .map((p) => [p.stripe_customer_id as string, p.id as string])
    )
    const profileByEmail = new Map(
      (profiles ?? []).filter((p) => p.email).map((p) => [p.email as string, p.id as string])
    )

    let imported = 0
    let skipped = 0
    const skippedReasons: string[] = []

    for (const sub of allSubs) {
      const customer = sub.customer as Stripe.Customer
      const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : customer.id
      const customerEmail =
        typeof sub.customer === 'object' ? (sub.customer as Stripe.Customer).email : null

      // Match profile
      let clientId = profileByCustomerId.get(stripeCustomerId)
      if (!clientId && customerEmail) clientId = profileByEmail.get(customerEmail)
      if (!clientId) {
        skipped++
        skippedReasons.push(`Cliente no encontrado: ${customerEmail ?? stripeCustomerId}`)
        continue
      }

      // Match local plan
      const priceId = sub.items.data[0]?.price?.id
      const localPlanId = priceId ? planByPriceId.get(priceId) : undefined
      if (!localPlanId) {
        skipped++
        skippedReasons.push(`Plan no importado para precio: ${priceId}`)
        continue
      }

      const status =
        sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due'
        : sub.status === 'canceled' ? 'cancelled'
        : 'inactive'

      await adminClient.from('client_subscriptions').upsert(
        {
          client_id: clientId,
          plan_id: localPlanId,
          status,
          stripe_subscription_id: sub.id,
          current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        },
        { onConflict: 'stripe_subscription_id' }
      )

      // Store stripe_customer_id on profile if missing
      if (!profileByCustomerId.has(stripeCustomerId)) {
        await adminClient
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', clientId)
        profileByCustomerId.set(stripeCustomerId, clientId)
      }

      imported++
    }

    return NextResponse.json({ imported, skipped, total: allSubs.length, skippedReasons })
  } catch (err) {
    console.error('Error importing subscriptions:', err)
    return NextResponse.json({ error: 'Error al importar suscripciones' }, { status: 500 })
  }
}
