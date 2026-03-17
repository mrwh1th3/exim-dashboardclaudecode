import { getAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { fullName, email, companyName, phone, flowTemplateId, planId } = await request.json()

  if (!fullName || !email) {
    return NextResponse.json({ error: 'fullName y email son requeridos' }, { status: 400 })
  }

  let adminClient: ReturnType<typeof getAdminClient>
  try {
    adminClient = getAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no configurada en el servidor' },
      { status: 500 }
    )
  }

  // Generate a random temporary password
  const tempPassword =
    Math.random().toString(36).slice(-6) +
    Math.random().toString(36).toUpperCase().slice(-2) +
    '1!'

  // Create auth user (email already confirmed so they can log in immediately)
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

  // Upsert profile (the DB trigger creates a basic one on signup)
  await adminClient.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    company_name: companyName || null,
    phone: phone || null,
    role: 'client',
    is_active: true,
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

  // Assign subscription plan if selected
  if (planId) {
    await adminClient.from('client_subscriptions').insert({
      client_id: userId,
      plan_id: planId,
      status: 'active',
    })
  }

  return NextResponse.json({ success: true, clientId: userId, tempPassword })
}
