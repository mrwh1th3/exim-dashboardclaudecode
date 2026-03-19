import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST() {
  // Guard: detect placeholder env vars before any API call
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.service_role ?? ''
  if (!stripeKey || stripeKey.startsWith('REPLACE_WITH')) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY no está configurada en Vercel. Ve a Settings → Environment Variables y agrega tu clave sk_live_ o sk_test_.' },
      { status: 500 },
    )
  }
  if (!serviceKey || serviceKey.startsWith('REPLACE_WITH')) {
    return NextResponse.json(
      { error: 'service_role no está configurada en Vercel. Ve a Settings → Environment Variables y agrega tu service role key de Supabase con el nombre "service_role".' },
      { status: 500 },
    )
  }

  try {
    const adminClient = getAdminClient()

    // ── 1. Sync plans: fetch all active products + prices from Stripe ──
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ])

    let plansUpserted = 0
    for (const product of products.data) {
      const productPrices = prices.data.filter(
        (p) => p.product === product.id && (p.unit_amount ?? 0) > 0,
      )
      for (const price of productPrices) {
        const amount = (price.unit_amount ?? 0) / 100
        const currency = price.currency.toUpperCase()
        const interval: 'monthly' | 'yearly' =
          price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

        await adminClient.from('subscription_plans').upsert(
          {
            name: product.name,
            description: product.description ?? null,
            price: amount,
            currency,
            interval,
            features: [],
            is_active: true,
            stripe_price_id: price.id,
          },
          { onConflict: 'stripe_price_id' },
        )
        plansUpserted++
      }
    }

    // ── 2. Sync subscriptions: fetch all Stripe subscriptions ──
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

    // Load fresh plan map and client profiles
    const [{ data: localPlans }, { data: profiles }] = await Promise.all([
      adminClient.from('subscription_plans').select('id, stripe_price_id'),
      adminClient
        .from('profiles')
        .select('id, stripe_customer_id, email')
        .eq('role', 'client'),
    ])

    const planByPriceId = new Map(
      (localPlans ?? [])
        .filter((p) => p.stripe_price_id)
        .map((p) => [p.stripe_price_id as string, p.id as string]),
    )
    const profileByCustomerId = new Map(
      (profiles ?? [])
        .filter((p) => p.stripe_customer_id)
        .map((p) => [p.stripe_customer_id as string, p.id as string]),
    )
    const profileByEmail = new Map(
      (profiles ?? [])
        .filter((p) => p.email)
        .map((p) => [p.email as string, p.id as string]),
    )

    let subsUpserted = 0
    let subsSkipped = 0

    for (const sub of allSubs) {
      const customer = sub.customer as Stripe.Customer
      const stripeCustomerId =
        typeof sub.customer === 'string' ? sub.customer : customer.id
      const customerEmail =
        typeof sub.customer === 'object'
          ? (sub.customer as Stripe.Customer).email
          : null

      let clientId = profileByCustomerId.get(stripeCustomerId)
      if (!clientId && customerEmail) clientId = profileByEmail.get(customerEmail)
      if (!clientId) { subsSkipped++; continue }

      const priceId = sub.items.data[0]?.price?.id
      const localPlanId = priceId ? planByPriceId.get(priceId) : undefined
      if (!localPlanId) { subsSkipped++; continue }

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
          current_period_start: new Date(
            (sub as any).current_period_start * 1000,
          ).toISOString(),
          current_period_end: new Date(
            (sub as any).current_period_end * 1000,
          ).toISOString(),
        },
        { onConflict: 'stripe_subscription_id' },
      )

      // Store stripe_customer_id on profile if missing
      if (!profileByCustomerId.has(stripeCustomerId)) {
        await adminClient
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', clientId)
        profileByCustomerId.set(stripeCustomerId, clientId)
      }

      subsUpserted++
    }

    return NextResponse.json({ plansUpserted, subsUpserted, subsSkipped })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Error syncing Stripe data:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
