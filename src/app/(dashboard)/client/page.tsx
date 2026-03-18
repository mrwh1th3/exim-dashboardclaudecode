'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, FileText, Calendar, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { Meteors } from '@/components/ui/meteors'
import {
  OnboardingDialog,
  createPlaceholderImage,
  type OnboardingSlide,
} from '@/components/ui/onboarding-dialog'

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    alt: 'Bienvenida a Exim',
    title: 'Bienvenido a Exim',
    description: 'Estamos felices de tenerte aquí. En los próximos pasos te explicaremos cómo sacar el máximo provecho de tu dashboard.',
    image: createPlaceholderImage({ accentColor: '#d86226', endColor: '#FFE8C2', startColor: '#FFF6E8', title: 'Bienvenida' }),
  },
  {
    id: 'onboarding',
    alt: 'Completar Onboarding',
    title: 'Completa tu Onboarding',
    description: 'Dirígete a la sección de Onboarding para completar los formularios iniciales. Esto nos ayuda a personalizar nuestros servicios para ti.',
    image: createPlaceholderImage({ accentColor: '#0A3D30', endColor: '#CAF6E8', startColor: '#E8FFF7', title: 'Onboarding' }),
  },
  {
    id: 'requests',
    alt: 'Gestión de Solicitudes',
    title: 'Gestiona tus Solicitudes',
    description: 'Desde "Solicitudes" puedes pedir cambios en tu página web, agregar productos y más. Respondemos en menos de 48 horas.',
    image: createPlaceholderImage({ accentColor: '#0B1E47', endColor: '#CDE2FF', startColor: '#EAF2FF', title: 'Solicitudes' }),
  },
  {
    id: 'social',
    alt: 'Estrategia Social',
    title: 'Revisa tu Estrategia Social',
    description: 'Accede al calendario de contenido para ver los posts programados y la estrategia de redes sociales diseñada para tu marca.',
    image: createPlaceholderImage({ accentColor: '#2D1457', endColor: '#E1D4FF', startColor: '#F2ECFF', title: 'Redes Sociales' }),
  },
]

export default function ClientPortalPage() {
  const user = useAuthStore((state) => state.user)
  const [plan, setPlan] = useState<{ name: string; price: number; currency: string } | null>(null)
  const [activeRequestsCount, setActiveRequestsCount] = useState(0)
  const [nextPost, setNextPost] = useState<{ scheduled_date: string; title?: string } | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState(0)
  const [onboardingText, setOnboardingText] = useState('Sin etapas')

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    const userId = user.id

    void (async () => {
      // Subscription + plan
      const { data: sub } = await supabase
        .from('client_subscriptions')
        .select('subscription_plans(name, price, currency)')
        .eq('client_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (sub?.subscription_plans) {
        setPlan(sub.subscription_plans as { name: string; price: number; currency: string })
      }

      // Active requests count
      const { count } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', userId)
      setActiveRequestsCount(count ?? 0)

      // Next upcoming post
      const today = new Date().toISOString().split('T')[0]
      const { data: post } = await supabase
        .from('posts')
        .select('scheduled_date, title')
        .eq('client_id', userId)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle()
      setNextPost(post)

      // Onboarding progress
      const { data: flow } = await supabase
        .from('client_flows')
        .select('id')
        .eq('client_id', userId)
        .maybeSingle()
      if (flow) {
        const { data: stages } = await supabase
          .from('client_stage_progress')
          .select('status')
          .eq('client_flow_id', flow.id)
        if (stages?.length) {
          const total = stages.length
          const completed = stages.filter((s: { status: string }) => s.status === 'completed').length
          setOnboardingProgress(Math.round((completed / total) * 100))
          setOnboardingText(`${completed} de ${total} etapas completadas`)
        }
      }
    })()
  }, [user?.id])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
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
        <OnboardingDialog
          defaultOpen={false}
          slides={ONBOARDING_SLIDES}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Progreso Onboarding"
          value={`${onboardingProgress}%`}
          icon={<BarChart3 className="h-6 w-6" />}
          description={onboardingText}
        />
        <StatCard
          title="Solicitudes"
          value={activeRequestsCount}
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
          value={nextPost?.scheduled_date ?? 'Sin posts'}
          icon={<Calendar className="h-6 w-6" />}
          description={nextPost?.title ?? undefined}
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
