import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { planId, clientId } = await request.json()

  if (!planId || !clientId) {
    return NextResponse.json({ error: 'planId and clientId are required' }, { status: 400 })
  }

  // Get plan
  const { data: plan, error: planError } = await adminClient
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !plan?.stripe_price_id) {
    return NextResponse.json({ error: 'Plan not found or missing Stripe price' }, { status: 404 })
  }

  // Get client profile
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Get or create Stripe customer
  let stripeCustomerId = profile.stripe_customer_id
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.full_name,
      metadata: { supabase_id: clientId },
    })
    stripeCustomerId = customer.id

    // Save customer ID to profile
    await adminClient
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', clientId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/admin/subscriptions?success=true`,
    cancel_url: `${appUrl}/admin/subscriptions?cancelled=true`,
    metadata: { client_id: clientId, plan_id: planId },
    subscription_data: {
      metadata: { client_id: clientId, plan_id: planId },
    },
  })

  return NextResponse.json({ url: session.url })
}
