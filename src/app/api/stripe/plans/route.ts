import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

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
