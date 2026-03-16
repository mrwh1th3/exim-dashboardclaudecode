'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { SocialStrategy } from '@/types/social'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, FileText } from 'lucide-react'

interface ClientOption { id: string; fullName: string }

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function StrategyPage() {
  const { user } = useAuthStore()
  const [strategies, setStrategies] = useState<SocialStrategy[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<SocialStrategy | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newStrategy, setNewStrategy] = useState({ clientId: '', title: '', content: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: strats }, { data: clientsData }] = await Promise.all([
        supabase.from('social_strategies').select('*, profiles!social_strategies_client_id_fkey(full_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
      ])
      setClients((clientsData ?? []).map((c) => ({ id: c.id, fullName: c.full_name ?? '' })))
      setStrategies(
        (strats ?? []).map((s) => ({
          id: s.id,
          clientId: s.client_id,
          clientName: (s.profiles as { full_name: string } | null)?.full_name ?? '',
          title: s.title,
          content: s.content ?? '',
          createdBy: s.created_by,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }))
      )
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!newStrategy.clientId || !newStrategy.title) {
      toast.error('Cliente y título son requeridos')
      return
    }
    const supabase = createClient()
    const { data, error } = await supabase
      .from('social_strategies')
      .insert({
        client_id: newStrategy.clientId,
        title: newStrategy.title,
        content: newStrategy.content,
        created_by: user?.id,
      })
      .select('*, profiles!social_strategies_client_id_fkey(full_name)')
      .single()
    if (error) { toast.error('Error al crear la estrategia'); return }
    setStrategies((prev) => [{
      id: data.id,
      clientId: data.client_id,
      clientName: (data.profiles as { full_name: string } | null)?.full_name ?? '',
      title: data.title,
      content: data.content ?? '',
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, ...prev])
    setNewStrategy({ clientId: '', title: '', content: '' })
    setDialogOpen(false)
    toast.success('Estrategia creada exitosamente')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estrategias</h2>
          <p className="text-muted-foreground">Estrategias de contenido para redes sociales por cliente</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Estrategia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Estrategia</DialogTitle>
              <DialogDescription>Define la estrategia de contenido para un cliente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={newStrategy.clientId} onValueChange={(v) => setNewStrategy({ ...newStrategy, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newStrategy.title} onChange={(e) => setNewStrategy({ ...newStrategy, title: e.target.value })} placeholder="Ej: Estrategia Q1 2026" />
              </div>
              <div className="space-y-2">
                <Label>Contenido (HTML o texto)</Label>
                <Textarea value={newStrategy.content} onChange={(e) => setNewStrategy({ ...newStrategy, content: e.target.value })} placeholder="Escribe la estrategia..." rows={8} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedStrategy(strategy); setSheetOpen(true) }}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{strategy.title}</CardTitle>
                  <CardDescription>{strategy.clientName}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{stripHtml(strategy.content)}</p>
              <p className="text-xs text-muted-foreground mt-3">Creado: {new Date(strategy.createdAt).toLocaleDateString('es-MX')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedStrategy && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStrategy.title}</SheetTitle>
                <SheetDescription>{selectedStrategy.clientName}</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedStrategy.content }} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
