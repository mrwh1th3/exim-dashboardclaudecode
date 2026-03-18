import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { priceId, name, description } = await request.json()
    if (!priceId || !name) {
      return NextResponse.json({ error: 'priceId y name son requeridos' }, { status: 400 })
    }

    const adminClient = getAdminClient()

    // Prevent duplicate import
    const { data: existing } = await adminClient
      .from('subscription_plans')
      .select('id')
      .eq('stripe_price_id', priceId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Este precio ya fue importado' }, { status: 409 })
    }

    const price = await stripe.prices.retrieve(priceId)
    const amount = (price.unit_amount ?? 0) / 100
    const currency = price.currency.toUpperCase()
    const interval: 'monthly' | 'yearly' =
      price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

    const { error } = await adminClient.from('subscription_plans').insert({
      name,
      description: description || null,
      price: amount,
      currency,
      interval,
      features: [],
      is_active: true,
      stripe_price_id: priceId,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error importing plan:', err)
    return NextResponse.json({ error: 'Error al importar plan' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ])

    const plans = products.data
      .map((product) => {
        const productPrices = prices.data
          .filter((p) => p.product === product.id && (p.unit_amount ?? 0) > 0)
          .map((p) => ({
            id: p.id,
            amount: (p.unit_amount ?? 0) / 100,
            currency: p.currency.toUpperCase(),
            type: p.type as 'one_time' | 'recurring',
            interval: p.recurring?.interval ?? null,
            intervalCount: p.recurring?.interval_count ?? 1,
          }))
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: productPrices,
        }
      })
      .filter((plan) => plan.prices.length > 0)
      .sort((a, b) => {
        const minA = Math.min(...a.prices.map((p) => p.amount))
        const minB = Math.min(...b.prices.map((p) => p.amount))
        return minA - minB
      })

    return NextResponse.json({ plans })
  } catch (err) {
    console.error('Error fetching Stripe plans:', err)
    return NextResponse.json({ error: 'Error al obtener planes de Stripe' }, { status: 500 })
  }
}
