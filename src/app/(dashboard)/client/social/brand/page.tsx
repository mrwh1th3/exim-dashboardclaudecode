'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { BrandGuideline } from '@/types/social'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import { Palette, Type, Mic, BookOpen, Check, X } from 'lucide-react'

const TONE_LABELS: Record<string, string> = { formal: 'Formal', neutral: 'Neutral', casual: 'Cercano / Casual' }
const TREATMENT_LABELS: Record<string, string> = { tu: 'Tú', usted: 'Usted' }

export default function ClientBrandPage() {
  const { user } = useAuthStore()
  const [guide, setGuide] = useState<BrandGuideline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('client_id', user.id)
        .maybeSingle()
      if (data) {
        setGuide({
          id: data.id,
          clientId: data.client_id,
          primaryFont: data.primary_font ?? undefined,
          primaryFontStyle: data.primary_font_style ?? undefined,
          secondaryFont: data.secondary_font ?? undefined,
          secondaryFontStyle: data.secondary_font_style ?? undefined,
          colors: data.colors ?? [],
          tone: data.tone ?? undefined,
          personality: data.personality ?? [],
          avoidTopics: data.avoid_topics ?? [],
          approvedEmojis: data.approved_emojis ?? [],
          clientTreatment: data.client_treatment ?? undefined,
          safeZones: data.safe_zones ?? undefined,
          logoRules: data.logo_rules ?? undefined,
          photoStyle: data.photo_style ?? undefined,
          dosList: data.dos_list ?? [],
          dontsList: data.donts_list ?? [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        })
      }
      setLoading(false)
    })()
  }, [user?.id])

  if (loading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-64 animate-pulse rounded bg-muted" /></div>

  if (!guide) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Brand Guideline</h2>
          <p className="text-muted-foreground">Identidad visual y voz de tu marca</p>
        </div>
        <EmptyState
          icon={<Palette className="h-10 w-10" />}
          title="Guideline en preparación"
          description="Tu equipo está preparando el brand guideline de tu marca. Te notificaremos cuando esté listo."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Guideline</h2>
        <p className="text-muted-foreground">Identidad visual y voz de tu marca · Actualizado {new Date(guide.updatedAt).toLocaleDateString('es-MX')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* TYPOGRAPHY */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Tipografía</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {guide.primaryFont ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Font Principal · {guide.primaryFontStyle ?? 'Regular'}</p>
                  <p className="text-2xl" style={{ fontFamily: guide.primaryFont }}>{guide.primaryFont}</p>
                  <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: guide.primaryFont }}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789
                  </p>
                </div>
                {guide.secondaryFont && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Font Secundario · {guide.secondaryFontStyle ?? 'Regular'}</p>
                      <p className="text-xl" style={{ fontFamily: guide.secondaryFont }}>{guide.secondaryFont}</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tipografía no definida aún</p>
            )}
          </CardContent>
        </Card>

        {/* COLORS */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Paleta de Colores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {guide.colors.length > 0 ? (
              <div className="space-y-2">
                {guide.colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg border flex-shrink-0" style={{ backgroundColor: color.hex }} />
                    <div>
                      <p className="text-sm font-medium">{color.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{color.hex}</p>
                      {color.usage && <p className="text-xs text-muted-foreground">{color.usage}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Paleta no definida aún</p>
            )}
          </CardContent>
        </Card>

        {/* VOICE */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Voz y Personalidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {guide.tone && <Badge variant="secondary">{TONE_LABELS[guide.tone]}</Badge>}
              {guide.clientTreatment && <Badge variant="outline">Trato: {TREATMENT_LABELS[guide.clientTreatment]}</Badge>}
              {guide.photoStyle && <Badge variant="outline">{guide.photoStyle}</Badge>}
            </div>
            {guide.personality.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Personalidad</p>
                <div className="flex flex-wrap gap-1">
                  {guide.personality.map((p) => (
                    <Badge key={p} variant="default" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            {guide.avoidTopics.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Temas a evitar</p>
                <div className="flex flex-wrap gap-1">
                  {guide.avoidTopics.map((t, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RULES */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Reglas de Uso</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {guide.logoRules && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reglas del logo</p>
                <p className="text-sm whitespace-pre-wrap">{guide.logoRules}</p>
              </div>
            )}
            {(guide.dosList.length > 0 || guide.dontsList.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {guide.dosList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Do's</p>
                    {guide.dosList.map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-sm mb-1">
                        <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {guide.dontsList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 mb-1">Don'ts</p>
                    {guide.dontsList.map((item, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-sm mb-1">
                        <X className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
