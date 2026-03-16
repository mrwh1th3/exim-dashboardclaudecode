import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { clientId } = await request.json()

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  }

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', clientId)
    .single()

  if (error || !profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found for this client' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/client/subscription`,
  })

  return NextResponse.json({ url: session.url })
}
