'use client'

import { useState } from 'react'
import { mockStrategies } from '@/data/mock-posts'
import { mockClients } from '@/data/mock-clients'
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

function stripHtml(html: string): string {
  const tmp = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return tmp
}

export default function StrategyPage() {
  const [strategies, setStrategies] = useState(mockStrategies)
  const [selectedStrategy, setSelectedStrategy] = useState<SocialStrategy | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newStrategy, setNewStrategy] = useState({
    clientId: '',
    title: '',
    content: '',
  })

  const handleCardClick = (strategy: SocialStrategy) => {
    setSelectedStrategy(strategy)
    setSheetOpen(true)
  }

  const handleCreate = () => {
    if (!newStrategy.clientId || !newStrategy.title) {
      toast.error('Cliente y título son requeridos')
      return
    }
    const client = mockClients.find((c) => c.id === newStrategy.clientId)
    const strategy: SocialStrategy = {
      id: `strat-${Date.now()}`,
      clientId: newStrategy.clientId,
      clientName: client?.fullName ?? '',
      title: newStrategy.title,
      content: newStrategy.content,
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStrategies([...strategies, strategy])
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Estrategia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Estrategia</DialogTitle>
              <DialogDescription>Define la estrategia de contenido para un cliente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={newStrategy.clientId}
                  onValueChange={(v) => setNewStrategy({ ...newStrategy, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newStrategy.title}
                  onChange={(e) => setNewStrategy({ ...newStrategy, title: e.target.value })}
                  placeholder="Ej: Estrategia Q1 2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenido (HTML o texto)</Label>
                <Textarea
                  value={newStrategy.content}
                  onChange={(e) => setNewStrategy({ ...newStrategy, content: e.target.value })}
                  placeholder="Escribe la estrategia..."
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <Card
            key={strategy.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(strategy)}
          >
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
              <p className="text-sm text-muted-foreground line-clamp-3">
                {stripHtml(strategy.content)}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Creado: {new Date(strategy.createdAt).toLocaleDateString('es-MX')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full View Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedStrategy && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStrategy.title}</SheetTitle>
                <SheetDescription>{selectedStrategy.clientName}</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedStrategy.content }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
