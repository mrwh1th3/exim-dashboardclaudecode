'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, FileText, Calendar, ArrowRight, User, Plus, CreditCard } from 'lucide-react'
import {
  OnboardingDialog,
  createPlaceholderImage,
  type OnboardingSlide,
} from '@/components/ui/onboarding-dialog'
import { ClientOnboardingSection } from './onboarding/page'
import { ClientRequestsSection } from './requests/page'
import { ClientSubscriptionSection } from './subscription/page'
import { ClientWebSection } from './web/page'

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
    description: 'Desde "Solicitudes" puedes agregar productos y más. Respondemos en menos de 48 horas.',
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

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function ClientPortalPage() {
  const user = useAuthStore((state) => state.user)
  const [plan, setPlan] = useState<{ name: string; price: number; currency: string } | null>(null)
  const [activeRequestsCount, setActiveRequestsCount] = useState(0)
  const [nextPost, setNextPost] = useState<{ scheduled_date: string; title?: string } | null>(null)
  const [onboardingProgress, setOnboardingProgress] = useState(0)
  const [onboardingText, setOnboardingText] = useState('Sin datos')
  const [welcomeChecked, setWelcomeChecked] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    const userId = user.id

    void (async () => {
      const { data: sub } = await supabase
        .from('client_subscriptions')
        .select('subscription_plans(name, price, currency)')
        .eq('client_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (sub?.subscription_plans) {
        setPlan(sub.subscription_plans as { name: string; price: number; currency: string })
      }

      const { count } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', userId)
      setActiveRequestsCount(count ?? 0)

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

  // Auto-open welcome dialog on first visit per user
  useEffect(() => {
    if (!user?.id) return
    const key = `welcome_seen_${user.id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      setShowWelcome(true)
    }
    setWelcomeChecked(true)
  }, [user?.id])

  // Handle hash navigation on page load (e.g. /client#solicitudes)
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [])

  return (
    <div>
      {/* ─────────── INICIO ─────────── */}
      <section id="inicio" className="scroll-mt-14 space-y-6 pb-12">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenido,{' '}
              <span className="text-primary">{user?.fullName ?? 'Cliente'}</span>
            </h1>
            <p className="text-muted-foreground">Resumen de tu cuenta y servicios</p>
          </div>
          {welcomeChecked && (
            <OnboardingDialog defaultOpen={showWelcome} slides={ONBOARDING_SLIDES} />
          )}
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

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => scrollToSection('onboarding')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-primary" />
                        <p className="font-semibold">Completar Onboarding</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Continúa con tu proceso</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => scrollToSection('solicitudes')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Plus className="h-5 w-5 text-primary" />
                        <p className="font-semibold">Nueva Solicitud</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Envía un nuevo producto</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => scrollToSection('suscripcion')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <p className="font-semibold">Mi Suscripción</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Gestiona tu plan actual</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ─────────── ONBOARDING ─────────── */}
      <section id="onboarding" className="scroll-mt-14 border-t pt-8 pb-12">
        <ClientOnboardingSection />
      </section>

      {/* ─────────── SOLICITUDES ─────────── */}
      <section id="solicitudes" className="scroll-mt-14 border-t pt-8 pb-12">
        <ClientRequestsSection />
      </section>

      {/* ─────────── SUSCRIPCIÓN ─────────── */}
      <section id="suscripcion" className="scroll-mt-14 border-t pt-8 pb-12">
        <ClientSubscriptionSection />
      </section>

      {/* ─────────── PÁGINA WEB ─────────── */}
      <section id="web" className="scroll-mt-14 border-t pt-8 pb-12">
        <ClientWebSection />
      </section>
    </div>
  )
}
