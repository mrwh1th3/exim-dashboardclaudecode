import { getAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { fullName, email, companyName, phone, flowTemplateId, planIds, stripeCustomerId: explicitStripeCustomerId } = await request.json()

  // Support both single planId (legacy) and multiple planIds
  const planIdsArray: string[] = planIds ?? []

  if (!fullName || !email) {
    return NextResponse.json({ error: 'fullName y email son requeridos' }, { status: 400 })
  }

  let adminClient: ReturnType<typeof getAdminClient>
  try {
    adminClient = getAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'service_role (SUPABASE_SERVICE_ROLE_KEY) no configurada en el servidor' },
      { status: 500 }
    )
  }

  // Generate temporary password
  const tempPassword =
    Math.random().toString(36).slice(-6) +
    Math.random().toString(36).toUpperCase().slice(-2) +
    '1!'

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Error creando usuario' },
      { status: 400 }
    )
  }

  const userId = authData.user.id

  // Create or find Stripe customer so subscriptions can be linked later
  let stripeCustomerId: string | null = explicitStripeCustomerId ?? null
  if (!stripeCustomerId) {
    try {
      const existing = await stripe.customers.list({ email, limit: 1 })
      if (existing.data.length > 0) {
        stripeCustomerId = existing.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email,
          name: fullName,
          ...(companyName && { description: companyName }),
          metadata: { supabase_user_id: userId },
        })
        stripeCustomerId = customer.id
      }
    } catch {
      // Stripe not configured — continue without linking
    }
  }

  // Upsert profile
  await adminClient.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    company_name: companyName || null,
    phone: phone || null,
    role: 'client',
    is_active: true,
    ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
  })

  // Assign onboarding flow if selected
  if (flowTemplateId) {
    const { data: flowData } = await adminClient
      .from('client_flows')
      .insert({
        client_id: userId,
        flow_template_id: flowTemplateId,
        status: 'not_started',
      })
      .select('id')
      .single()

    if (flowData) {
      const { data: stages } = await adminClient
        .from('flow_stages')
        .select('id, order_index')
        .eq('flow_template_id', flowTemplateId)
        .order('order_index', { ascending: true })

      if (stages?.length) {
        await adminClient.from('client_stage_progress').insert(
          stages.map((stage, idx) => ({
            client_flow_id: flowData.id,
            stage_id: stage.id,
            status: idx === 0 ? 'available' : 'locked',
          }))
        )
      }
    }
  }

  // Assign subscription plans if selected (multiple plans supported)
  if (planIdsArray.length > 0) {
    for (const planIdItem of planIdsArray) {
      // Get stripe_price_id of the selected local plan
      const { data: plan } = await adminClient
        .from('subscription_plans')
        .select('stripe_price_id')
        .eq('id', planIdItem)
        .single()

      // Check if there's already an active Stripe subscription for this customer + price
      let stripeSubscriptionId: string | null = null
      let initialStatus: 'pending' | 'active' = 'pending'

      if (stripeCustomerId && plan?.stripe_price_id) {
        try {
          const subs = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
            limit: 100,
          })
          const match = subs.data.find((s) =>
            s.items.data.some((item) => item.price.id === plan.stripe_price_id)
          )
          if (match) {
            stripeSubscriptionId = match.id
            // If already paid in Stripe, mark as active
            initialStatus = 'active'
          }
        } catch {
          // Stripe not configured
        }
      }

      await adminClient.from('client_subscriptions').insert({
        client_id: userId,
        plan_id: planIdItem,
        status: initialStatus,
        ...(stripeSubscriptionId ? { stripe_subscription_id: stripeSubscriptionId } : {}),
      })
    }
  }

  return NextResponse.json({ success: true, clientId: userId, tempPassword })
}
