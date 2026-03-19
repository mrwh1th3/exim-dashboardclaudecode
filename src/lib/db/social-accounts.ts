import { createClient } from '@/lib/supabase/server'
import { SocialAccount, Platform } from '@/types/social'

function mapRow(row: any): SocialAccount {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    network: row.network as Platform,
    accountId: row.account_id,
    accountName: row.account_name ?? undefined,
    accessToken: row.access_token,
    refreshToken: row.refresh_token ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSocialAccounts(tenantId: string): Promise<SocialAccount[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function upsertSocialAccount(
  tenantId: string,
  network: Platform,
  payload: {
    accountId: string
    accountName?: string
    accessToken: string
    refreshToken?: string
    expiresAt?: string
  }
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('social_accounts')
    .upsert(
      {
        tenant_id: tenantId,
        network,
        account_id: payload.accountId,
        account_name: payload.accountName,
        access_token: payload.accessToken,
        refresh_token: payload.refreshToken ?? null,
        expires_at: payload.expiresAt ?? null,
        is_active: true,
      },
      { onConflict: 'tenant_id,network' }
    )
}

export async function disconnectSocialAccount(tenantId: string, network: Platform): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('social_accounts')
    .update({ is_active: false, access_token: '', refresh_token: null })
    .eq('tenant_id', tenantId)
    .eq('network', network)
}
