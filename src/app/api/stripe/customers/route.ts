import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function GET() {
  try {
    // Paginate all active subscriptions with customer expanded
    const allSubs: Stripe.Subscription[] = []
    let hasMore = true
    let startingAfter: string | undefined
    while (hasMore) {
      const batch = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.customer', 'data.items.data.price.product'],
      })
      allSubs.push(...batch.data)
      hasMore = batch.has_more
      startingAfter = batch.data[batch.data.length - 1]?.id
    }

    const customers = allSubs.map((sub) => {
      const customer = sub.customer as Stripe.Customer
      const item = sub.items.data[0]
      const price = item?.price
      const product = price?.product as Stripe.Product | undefined
      const amount = (price?.unit_amount ?? 0) / 100
      const currency = price?.currency?.toUpperCase() ?? 'MXN'
      const interval = price?.recurring?.interval ?? 'month'
      const intervalCount = price?.recurring?.interval_count ?? 1

      let intervalLabel = '/mes'
      if (interval === 'year') intervalLabel = '/año'
      else if (interval === 'month' && intervalCount === 2) intervalLabel = '/2 meses'
      else if (interval === 'week') intervalLabel = '/semana'

      return {
        customerId: customer.id,
        customerName: customer.name ?? null,
        customerEmail: customer.email ?? null,
        subscriptionId: sub.id,
        priceId: price?.id ?? null,
        planName: product?.name ?? 'Plan',
        amount,
        currency,
        intervalLabel,
        status: sub.status,
      }
    })

    return NextResponse.json({ customers })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Error fetching Stripe customers:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
