'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { SocialStrategy } from '@/types/social'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/empty-state'
import { FileText, BookOpen } from 'lucide-react'
import { ServiceNotAvailable } from '@/components/shared/service-not-available'
import { useClientServices } from '@/hooks/use-client-services'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function ClientStrategyPage() {
  const user = useAuthStore((s) => s.user)
  const { hasSocialMedia, loading: servicesLoading } = useClientServices()
  const [strategies, setStrategies] = useState<SocialStrategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<SocialStrategy | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Show service not available if client doesn't have social media service
  if (!servicesLoading && !hasSocialMedia) {
    return <ServiceNotAvailable serviceName="Redes Sociales" />
  }

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('social_strategies')
        .select('*')
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })
      setStrategies(
        (data ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          clientId: row.client_id,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      )
    })()
  }, [user?.id])

  const handleCardClick = (strategy: SocialStrategy) => {
    setSelectedStrategy(strategy)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estrategia de Contenido</h2>
        <p className="text-muted-foreground">
          Revisa las estrategias de contenido definidas para tu marca
        </p>
      </div>

      {strategies.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="Sin estrategias asignadas"
          description="Aún no tienes estrategias de contenido definidas. Tu equipo te notificará cuando estén listas."
        />
      ) : (
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
                    <CardDescription>
                      Actualizado: {new Date(strategy.updatedAt).toLocaleDateString('es-MX')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {stripHtml(strategy.content)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedStrategy && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStrategy.title}</SheetTitle>
                <SheetDescription>
                  Última actualización: {new Date(selectedStrategy.updatedAt).toLocaleDateString('es-MX')}
                </SheetDescription>
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
