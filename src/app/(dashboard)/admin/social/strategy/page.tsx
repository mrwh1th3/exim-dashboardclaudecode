'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { SocialStrategy, StrategyStatus } from '@/types/social'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, FileText, ChevronRight, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

interface ClientOption { id: string; fullName: string }

const statusConfig: Record<StrategyStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
  draft: { label: 'Borrador', variant: 'secondary', className: '' },
  sent_for_review: { label: 'En revisión', variant: 'outline', className: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
  adjustments_requested: { label: 'Ajustes solicitados', variant: 'outline', className: 'border-orange-400 text-orange-700 bg-orange-50' },
  approved: { label: 'Aprobada', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  calendar_active: { label: 'Calendario activo', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  closed: { label: 'Cerrada', variant: 'secondary', className: 'opacity-60' },
}

const STATUS_TRANSITIONS: Partial<Record<StrategyStatus, StrategyStatus[]>> = {
  draft: ['sent_for_review'],
  sent_for_review: ['adjustments_requested', 'approved'],
  adjustments_requested: ['sent_for_review'],
  approved: ['calendar_active'],
  calendar_active: ['closed'],
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return ''
  return `${new Date(start).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })} — ${new Date(end).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`
}

export default function StrategyPage() {
  const { user } = useAuthStore()
  const [strategies, setStrategies] = useState<SocialStrategy[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<SocialStrategy | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [newStrategy, setNewStrategy] = useState({
    clientId: '', title: '', content: '', bimesterStart: '', bimesterEnd: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: strats }, { data: clientsData }] = await Promise.all([
        supabase.from('social_strategies')
          .select('*, profiles!social_strategies_client_id_fkey(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
      ])
      setClients((clientsData ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
      setStrategies((strats ?? []).map(mapRow))
    }
    load()
  }, [])

  function mapRow(s: any): SocialStrategy {
    return {
      id: s.id,
      clientId: s.client_id,
      clientName: (s.profiles as { full_name: string } | null)?.full_name ?? '',
      title: s.title,
      content: s.content ?? '',
      status: (s.status ?? 'draft') as StrategyStatus,
      bimesterStart: s.bimester_start ?? undefined,
      bimesterEnd: s.bimester_end ?? undefined,
      approvedAt: s.approved_at ?? undefined,
      createdBy: s.created_by,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }
  }

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
        status: 'draft',
        bimester_start: newStrategy.bimesterStart || null,
        bimester_end: newStrategy.bimesterEnd || null,
        created_by: user?.id,
      })
      .select('*, profiles!social_strategies_client_id_fkey(full_name)')
      .single()
    if (error) { toast.error('Error al crear la estrategia'); return }
    setStrategies((prev) => [mapRow(data), ...prev])
    setNewStrategy({ clientId: '', title: '', content: '', bimesterStart: '', bimesterEnd: '' })
    setDialogOpen(false)
    toast.success('Estrategia creada')
  }

  const handleStatusChange = async (strategyId: string, newStatus: StrategyStatus) => {
    setUpdatingId(strategyId)
    const supabase = createClient()
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'approved') {
      updates.approved_at = new Date().toISOString()
    }
    const { error } = await supabase.from('social_strategies').update(updates).eq('id', strategyId)
    if (error) { toast.error('Error al actualizar estado'); setUpdatingId(null); return }
    setStrategies((prev) => prev.map((s) => s.id === strategyId ? { ...s, status: newStatus, approvedAt: newStatus === 'approved' ? new Date().toISOString() : s.approvedAt } : s))
    if (selectedStrategy?.id === strategyId) {
      setSelectedStrategy((prev) => prev ? { ...prev, status: newStatus } : prev)
    }
    toast.success(
      newStatus === 'approved' ? 'Estrategia aprobada — el calendario se desbloquea' :
      newStatus === 'sent_for_review' ? 'Enviada al cliente para revisión' :
      `Estado actualizado: ${statusConfig[newStatus]?.label}`
    )
    setUpdatingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estrategias</h2>
          <p className="text-muted-foreground">Ciclos bimestrales de contenido. La aprobación desbloquea el calendario.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} disablePointerDismissal={true}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Estrategia</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nueva Estrategia</DialogTitle>
              <DialogDescription>Define la estrategia de contenido para un ciclo bimestral.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={newStrategy.clientId} onValueChange={(v) => setNewStrategy({ ...newStrategy, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newStrategy.title} onChange={(e) => setNewStrategy({ ...newStrategy, title: e.target.value })} placeholder="Ej: Estrategia Bimestre Mar-Abr 2026" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Inicio del bimestre</Label>
                  <Input type="date" value={newStrategy.bimesterStart} onChange={(e) => setNewStrategy({ ...newStrategy, bimesterStart: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fin del bimestre</Label>
                  <Input type="date" value={newStrategy.bimesterEnd} onChange={(e) => setNewStrategy({ ...newStrategy, bimesterEnd: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contenido (HTML o texto)</Label>
                <Textarea value={newStrategy.content} onChange={(e) => setNewStrategy({ ...newStrategy, content: e.target.value })} placeholder="Escribe la estrategia..." rows={6} />
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
        {strategies.map((strategy) => {
          const cfg = statusConfig[strategy.status]
          const transitions = STATUS_TRANSITIONS[strategy.status] ?? []
          const isUpdating = updatingId === strategy.id
          return (
            <Card key={strategy.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedStrategy(strategy); setSheetOpen(true) }}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{strategy.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {strategy.clientName}
                      {strategy.bimesterStart && (
                        <><ChevronRight className="h-3 w-3" /><span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{formatDateRange(strategy.bimesterStart, strategy.bimesterEnd)}</span></>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={cfg.variant} className={cfg.className + ' shrink-0'}>{cfg.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(strategy.content)}</p>
                {transitions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    {transitions.map((t) => (
                      <Button
                        key={t}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(strategy.id, t)}
                      >
                        {t === 'approved' && <CheckCircle className="h-3 w-3 mr-1 text-green-500" />}
                        {t === 'sent_for_review' && <ChevronRight className="h-3 w-3 mr-1" />}
                        {t === 'adjustments_requested' && <AlertCircle className="h-3 w-3 mr-1 text-orange-500" />}
                        {statusConfig[t]?.label}
                      </Button>
                    ))}
                  </div>
                )}
                {strategy.status === 'approved' && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />Calendario desbloqueado
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedStrategy && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStrategy.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {selectedStrategy.clientName}
                  {selectedStrategy.bimesterStart && (
                    <span className="text-xs">{formatDateRange(selectedStrategy.bimesterStart, selectedStrategy.bimesterEnd)}</span>
                  )}
                  <Badge variant={statusConfig[selectedStrategy.status].variant} className={statusConfig[selectedStrategy.status].className}>
                    {statusConfig[selectedStrategy.status].label}
                  </Badge>
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Status actions */}
                {(STATUS_TRANSITIONS[selectedStrategy.status] ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(STATUS_TRANSITIONS[selectedStrategy.status] ?? []).map((t) => (
                      <Button
                        key={t}
                        variant={t === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        disabled={updatingId === selectedStrategy.id}
                        onClick={() => handleStatusChange(selectedStrategy.id, t)}
                        className={t === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {t === 'approved' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                        {statusConfig[t]?.label}
                      </Button>
                    ))}
                  </div>
                )}
                {selectedStrategy.approvedAt && (
                  <p className="text-xs text-muted-foreground">
                    Aprobada el {new Date(selectedStrategy.approvedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedStrategy.content }} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
