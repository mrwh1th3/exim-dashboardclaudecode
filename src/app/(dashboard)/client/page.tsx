'use client'

import Link from 'next/link'
import { BarChart3, FileText, Calendar, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { mockClientSubscriptions, mockPlans } from '@/data/mock-subscriptions'
import { mockRequests } from '@/data/mock-requests'
import { mockPosts } from '@/data/mock-posts'
import { StatCard } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClientPortalPage() {
  const user = useAuthStore((state) => state.user)

  const subscription = mockClientSubscriptions.find((s) => s.clientId === user?.id)
  const plan = subscription ? mockPlans.find((p) => p.id === subscription.planId) : null

  const activeRequests = mockRequests.filter(
    (r) => r.clientId === user?.id && !['status-5', 'status-6'].includes(r.statusId)
  )

  const upcomingPosts = mockPosts
    .filter((p) => p.clientId === user?.id && p.scheduledDate)
    .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''))

  const nextPost = upcomingPosts[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user?.fullName ?? 'Cliente'}
        </h1>
        <p className="text-muted-foreground">
          Resumen de tu cuenta y servicios
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Progreso Onboarding"
          value="66%"
          icon={<BarChart3 className="h-6 w-6" />}
          description="2 de 3 etapas completadas"
        />
        <StatCard
          title="Solicitudes Activas"
          value={activeRequests.length}
          icon={<FileText className="h-6 w-6" />}
        />
        <StatCard
          title="Plan Actual"
          value={plan?.name ?? 'Sin plan'}
          icon={<BarChart3 className="h-6 w-6" />}
          description={plan ? `$${plan.price} ${plan.currency}/mes` : undefined}
        />
        <StatCard
          title="Próximo Post"
          value={nextPost?.scheduledDate ?? 'Sin posts'}
          icon={<Calendar className="h-6 w-6" />}
          description={nextPost?.title}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/client/onboarding">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <div className="text-left">
                  <p className="font-semibold">Completar Onboarding</p>
                  <p className="text-xs text-muted-foreground">Continúa con tu proceso</p>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/client/requests/new">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <div className="text-left">
                  <p className="font-semibold">Nueva Solicitud</p>
                  <p className="text-xs text-muted-foreground">Envía un cambio o producto</p>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/client/social/calendar">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <div className="text-left">
                  <p className="font-semibold">Ver Calendario</p>
                  <p className="text-xs text-muted-foreground">Posts programados</p>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
