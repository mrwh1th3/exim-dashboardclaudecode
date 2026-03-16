'use client'

import Link from 'next/link'
import { BarChart3, FileText, Calendar, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { mockClientSubscriptions, mockPlans } from '@/data/mock-subscriptions'
import { mockRequests } from '@/data/mock-requests'
import { mockPosts } from '@/data/mock-posts'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Meteors } from '@/components/ui/meteors'

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
          Bienvenido,{' '}
          <AnimatedGradientText colorFrom="#d86226" colorTo="#7e230c" speed={0.8}>
            {user?.fullName ?? 'Cliente'}
          </AnimatedGradientText>
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

      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/client/onboarding">
              <ShimmerButton
                background="rgba(216,98,38,0.15)"
                shimmerColor="#d86226"
                borderRadius="8px"
                className="w-full justify-between h-auto py-4 px-4 border-primary/20 text-foreground"
              >
                <div className="text-left">
                  <p className="font-semibold">Completar Onboarding</p>
                  <p className="text-xs text-muted-foreground">Continúa con tu proceso</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </ShimmerButton>
            </Link>
            <Link href="/client/requests/new">
              <ShimmerButton
                background="rgba(216,98,38,0.15)"
                shimmerColor="#d86226"
                borderRadius="8px"
                className="w-full justify-between h-auto py-4 px-4 border-primary/20 text-foreground"
              >
                <div className="text-left">
                  <p className="font-semibold">Nueva Solicitud</p>
                  <p className="text-xs text-muted-foreground">Envía un cambio o producto</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </ShimmerButton>
            </Link>
            <Link href="/client/social/calendar">
              <ShimmerButton
                background="rgba(216,98,38,0.15)"
                shimmerColor="#d86226"
                borderRadius="8px"
                className="w-full justify-between h-auto py-4 px-4 border-primary/20 text-foreground"
              >
                <div className="text-left">
                  <p className="font-semibold">Ver Calendario</p>
                  <p className="text-xs text-muted-foreground">Posts programados</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </ShimmerButton>
            </Link>
          </div>
        </CardContent>
        <Meteors number={10} />
      </Card>
    </div>
  )
}
