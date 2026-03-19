import { createClient } from '@/lib/supabase/server'
import { BrandGuideline, BrandColor } from '@/types/social'

function mapRow(row: any): BrandGuideline {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: (row.profiles as { full_name: string } | null)?.full_name ?? undefined,
    primaryFont: row.primary_font ?? undefined,
    primaryFontStyle: row.primary_font_style ?? undefined,
    secondaryFont: row.secondary_font ?? undefined,
    secondaryFontStyle: row.secondary_font_style ?? undefined,
    colors: (row.colors as BrandColor[]) ?? [],
    tone: row.tone ?? undefined,
    personality: (row.personality as string[]) ?? [],
    avoidTopics: (row.avoid_topics as string[]) ?? [],
    approvedEmojis: (row.approved_emojis as string[]) ?? [],
    clientTreatment: row.client_treatment ?? undefined,
    safeZones: row.safe_zones ?? undefined,
    logoRules: row.logo_rules ?? undefined,
    photoStyle: row.photo_style ?? undefined,
    dosList: (row.dos_list as string[]) ?? [],
    dontsList: (row.donts_list as string[]) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getBrandGuideline(clientId: string): Promise<BrandGuideline | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*, profiles!brand_guidelines_client_id_fkey(full_name)')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data) : null
}

export async function getAllBrandGuidelines(): Promise<BrandGuideline[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*, profiles!brand_guidelines_client_id_fkey(full_name)')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function upsertBrandGuideline(
  clientId: string,
  updates: Partial<Omit<BrandGuideline, 'id' | 'clientId' | 'clientName' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('brand_guidelines')
    .upsert(
      {
        client_id: clientId,
        primary_font: updates.primaryFont,
        primary_font_style: updates.primaryFontStyle,
        secondary_font: updates.secondaryFont,
        secondary_font_style: updates.secondaryFontStyle,
        colors: updates.colors ?? [],
        tone: updates.tone,
        personality: updates.personality ?? [],
        avoid_topics: updates.avoidTopics ?? [],
        approved_emojis: updates.approvedEmojis ?? [],
        client_treatment: updates.clientTreatment,
        safe_zones: updates.safeZones,
        logo_rules: updates.logoRules,
        photo_style: updates.photoStyle,
        dos_list: updates.dosList ?? [],
        donts_list: updates.dontsList ?? [],
      },
      { onConflict: 'client_id' }
    )
}
