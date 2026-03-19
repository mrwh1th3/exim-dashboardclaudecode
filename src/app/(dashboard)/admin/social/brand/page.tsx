'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BrandGuideline, BrandColor } from '@/types/social'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Plus, Trash2, Palette, Type, Mic, BookOpen, Save } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

interface ClientOption { id: string; fullName: string }

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway',
  'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Nunito', 'Work Sans',
  'DM Sans', 'Plus Jakarta Sans', 'Space Grotesk', 'Bebas Neue', 'Oswald',
]
const FONT_STYLE_OPTIONS = ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Italic', 'Bold Italic']
const PERSONALITY_OPTIONS = [
  'Auténtico', 'Aspiracional', 'Educativo', 'Divertido', 'Experto',
  'Inspirador', 'Retador', 'Cercano', 'Profesional', 'Innovador',
]
const PHOTO_STYLE_OPTIONS = ['Editorial', 'Lifestyle', 'Producto', 'Minimalista', 'Documental', 'Flat lay']

function ColorSwatch({ color }: { color: BrandColor }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <div className="h-8 w-8 rounded-md border flex-shrink-0" style={{ backgroundColor: color.hex }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{color.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
        {color.usage && <p className="text-xs text-muted-foreground truncate">{color.usage}</p>}
      </div>
    </div>
  )
}

export default function AdminBrandPage() {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [guide, setGuide] = useState<BrandGuideline | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // Color editor
  const [newColor, setNewColor] = useState<BrandColor>({ name: '', hex: '#000000', usage: '' })

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: cl }, { data: bg }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
        supabase
          .from('brand_guidelines')
          .select('*, profiles!brand_guidelines_client_id_fkey(full_name)')
          .order('updated_at', { ascending: false }),
      ])
      setClients((cl ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
      setGuidelines((bg ?? []).map(mapRow))
    }
    void load()
  }, [])

  function mapRow(row: any): BrandGuideline {
    return {
      id: row.id,
      clientId: row.client_id,
      clientName: (row.profiles as { full_name: string } | null)?.full_name ?? '',
      primaryFont: row.primary_font ?? undefined,
      primaryFontStyle: row.primary_font_style ?? undefined,
      secondaryFont: row.secondary_font ?? undefined,
      secondaryFontStyle: row.secondary_font_style ?? undefined,
      colors: row.colors ?? [],
      tone: row.tone ?? undefined,
      personality: row.personality ?? [],
      avoidTopics: row.avoid_topics ?? [],
      approvedEmojis: row.approved_emojis ?? [],
      clientTreatment: row.client_treatment ?? undefined,
      safeZones: row.safe_zones ?? undefined,
      logoRules: row.logo_rules ?? undefined,
      photoStyle: row.photo_style ?? undefined,
      dosList: row.dos_list ?? [],
      dontsList: row.donts_list ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  function openEditor(client: ClientOption) {
    setSelectedClient(client)
    const existing = guidelines.find((g) => g.clientId === client.id)
    setGuide(
      existing ?? {
        id: '',
        clientId: client.id,
        clientName: client.fullName,
        colors: [],
        personality: [],
        avoidTopics: [],
        approvedEmojis: [],
        dosList: [],
        dontsList: [],
        createdAt: '',
        updatedAt: '',
      }
    )
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!guide || !selectedClient) return
    setSaving(true)
    const supabase = createClient()
    try {
      await supabase.from('brand_guidelines').upsert(
        {
          client_id: guide.clientId,
          primary_font: guide.primaryFont ?? null,
          primary_font_style: guide.primaryFontStyle ?? null,
          secondary_font: guide.secondaryFont ?? null,
          secondary_font_style: guide.secondaryFontStyle ?? null,
          colors: guide.colors,
          tone: guide.tone ?? null,
          personality: guide.personality,
          avoid_topics: guide.avoidTopics,
          approved_emojis: guide.approvedEmojis,
          client_treatment: guide.clientTreatment ?? null,
          safe_zones: guide.safeZones ?? null,
          logo_rules: guide.logoRules ?? null,
          photo_style: guide.photoStyle ?? null,
          dos_list: guide.dosList,
          donts_list: guide.dontsList,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id' }
      )
      // Reload guidelines
      const { data: bg } = await supabase
        .from('brand_guidelines')
        .select('*, profiles!brand_guidelines_client_id_fkey(full_name)')
        .order('updated_at', { ascending: false })
      setGuidelines((bg ?? []).map(mapRow))
      toast.success('Brand Guideline guardado')
      setSheetOpen(false)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function addColor() {
    if (!newColor.name || !newColor.hex) { toast.error('Nombre y color son requeridos'); return }
    setGuide((prev) => prev ? { ...prev, colors: [...prev.colors, { ...newColor }] } : prev)
    setNewColor({ name: '', hex: '#000000', usage: '' })
  }

  function removeColor(i: number) {
    setGuide((prev) => prev ? { ...prev, colors: prev.colors.filter((_, idx) => idx !== i) } : prev)
  }

  function togglePersonality(item: string) {
    if (!guide) return
    const has = guide.personality.includes(item)
    if (!has && guide.personality.length >= 3) { toast.error('Máximo 3 palabras de personalidad'); return }
    setGuide({ ...guide, personality: has ? guide.personality.filter((p) => p !== item) : [...guide.personality, item] })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Guidelines</h2>
        <p className="text-muted-foreground">Gestiona la identidad visual y voz de cada marca cliente</p>
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={<Palette className="h-10 w-10" />} title="Sin clientes" description="Crea clientes primero para gestionar sus brand guidelines." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const has = guidelines.find((g) => g.clientId === client.id)
            return (
              <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditor(client)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{client.fullName}</CardTitle>
                      <CardDescription>
                        {has ? `${has.colors.length} colores · ${has.personality.length} palabras` : 'Sin guideline aún'}
                      </CardDescription>
                    </div>
                    {has ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 shrink-0">Activo</Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">Pendiente</Badge>
                    )}
                  </div>
                </CardHeader>
                {has && has.colors.length > 0 && (
                  <CardContent>
                    <div className="flex gap-1 flex-wrap">
                      {has.colors.slice(0, 5).map((c, i) => (
                        <div key={i} className="h-5 w-5 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {guide && selectedClient && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedClient.fullName} — Brand Guideline</SheetTitle>
                <SheetDescription>Edita la identidad visual, paleta, voz y reglas de la marca</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* TYPOGRAPHY */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Tipografía</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Font Principal</Label>
                      <Select value={guide.primaryFont ?? ''} onValueChange={(v) => setGuide({ ...guide, primaryFont: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar font" /></SelectTrigger>
                        <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estilo</Label>
                      <Select value={guide.primaryFontStyle ?? ''} onValueChange={(v) => setGuide({ ...guide, primaryFontStyle: v })}>
                        <SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger>
                        <SelectContent>{FONT_STYLE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Font Secundario (opcional)</Label>
                      <Select value={guide.secondaryFont ?? ''} onValueChange={(v) => setGuide({ ...guide, secondaryFont: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar font" /></SelectTrigger>
                        <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estilo</Label>
                      <Select value={guide.secondaryFontStyle ?? ''} onValueChange={(v) => setGuide({ ...guide, secondaryFontStyle: v })}>
                        <SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger>
                        <SelectContent>{FONT_STYLE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {guide.primaryFont && (
                    <div className="mt-3 rounded-lg border p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Preview</p>
                      <p className="text-lg" style={{ fontFamily: guide.primaryFont }}>{selectedClient.fullName}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* COLORS */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Paleta de Colores</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {guide.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <ColorSwatch color={color} />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeColor(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Agregar color</p>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Nombre</Label>
                        <Input value={newColor.name} onChange={(e) => setNewColor({ ...newColor, name: e.target.value })} placeholder="Ej: Primario" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color</Label>
                        <div className="flex items-center gap-1">
                          <input type="color" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} className="h-8 w-10 rounded border cursor-pointer bg-transparent" />
                          <Input value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} className="h-8 w-24 font-mono text-xs" placeholder="#000000" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Uso (opcional)</Label>
                      <Input value={newColor.usage ?? ''} onChange={(e) => setNewColor({ ...newColor, usage: e.target.value })} placeholder="Ej: Fondo principal" className="h-8 text-sm" />
                    </div>
                    <Button variant="outline" size="sm" onClick={addColor} className="w-full">
                      <Plus className="h-3.5 w-3.5 mr-1" />Agregar
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* VOICE */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Voz y Tono</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tono de comunicación</Label>
                      <Select value={guide.tone ?? ''} onValueChange={(v) => setGuide({ ...guide, tone: v as BrandGuideline['tone'] })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="casual">Cercano / Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Trato al cliente</Label>
                      <Select value={guide.clientTreatment ?? ''} onValueChange={(v) => setGuide({ ...guide, clientTreatment: v as 'tu' | 'usted' })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tu">Tú</SelectItem>
                          <SelectItem value="usted">Usted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Label className="text-xs">Personalidad de marca (máx. 3)</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {PERSONALITY_OPTIONS.map((p) => (
                        <button
                          key={p}
                          onClick={() => togglePersonality(p)}
                          className={`rounded-full px-3 py-1 text-xs border transition-colors ${guide.personality.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Label className="text-xs">Temas a evitar (uno por línea)</Label>
                    <Textarea
                      value={guide.avoidTopics.join('\n')}
                      onChange={(e) => setGuide({ ...guide, avoidTopics: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Política&#10;Religión&#10;Competencia"
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div className="mt-3 space-y-1">
                    <Label className="text-xs">Estilo fotográfico</Label>
                    <Select value={guide.photoStyle ?? ''} onValueChange={(v) => setGuide({ ...guide, photoStyle: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{PHOTO_STYLE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* RULES */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Reglas de Uso</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Reglas del logo</Label>
                      <Textarea value={guide.logoRules ?? ''} onChange={(e) => setGuide({ ...guide, logoRules: e.target.value })} placeholder="Clear space, tamaños mínimos, posición..." rows={2} className="text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Safe zones y formatos</Label>
                      <Textarea value={guide.safeZones ?? ''} onChange={(e) => setGuide({ ...guide, safeZones: e.target.value })} placeholder="Post 1080x1080, Story 1080x1920, Carrusel..." rows={2} className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-green-600">Do's (uno por línea)</Label>
                        <Textarea
                          value={guide.dosList.join('\n')}
                          onChange={(e) => setGuide({ ...guide, dosList: e.target.value.split('\n').filter(Boolean) })}
                          placeholder="Usar paleta oficial&#10;Respetar tipografía"
                          rows={4}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-red-500">Don'ts (uno por línea)</Label>
                        <Textarea
                          value={guide.dontsList.join('\n')}
                          onChange={(e) => setGuide({ ...guide, dontsList: e.target.value.split('\n').filter(Boolean) })}
                          placeholder="No distorsionar el logo&#10;No usar colores no aprobados"
                          rows={4}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Brand Guideline'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
