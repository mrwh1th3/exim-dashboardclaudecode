import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY ?? process.env.public_api_stripe
    if (!key) {
      throw new Error('Falta STRIPE_SECRET_KEY o public_api_stripe en las variables de entorno')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

// Named export for convenience
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})
