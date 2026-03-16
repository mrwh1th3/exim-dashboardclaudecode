'use client'

import { useEffect, useState } from 'react'
import {
  Users, MessageSquare, CreditCard, Calendar,
  TrendingUp, ArrowUpRight, Activity, Clock,
  CheckCircle2, AlertCircle, Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { NumberTicker } from '@/components/ui/number-ticker'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  clients: number
  pendingRequests: number
  activeSubscriptions: number
  scheduledPosts: number
}

interface RecentRequest {
  id: string
  title: string
  clientName: string
  type: string
  statusName: string
  statusColor: string
  createdAt: string
}

interface ActivityItem {
  id: string
  clientName: string
  action: string
  date: string
  type: 'request' | 'subscription' | 'post' | 'client'
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  title, value, icon, gradient, description, trend,
}: {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  description?: string
  trend?: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* gradient accent bar */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5', gradient)} />

      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          <p className="text-4xl font-black tabular-nums text-foreground">
            <NumberTicker value={value} />
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              trend >= 0
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-600'
            )}>
              <ArrowUpRight className={cn('h-3 w-3', trend < 0 && 'rotate-180')} />
              {Math.abs(trend)}% este mes
            </span>
          )}
        </div>
        <div className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm',
          gradient
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = [
    'bg-violet-500', 'bg-indigo-500', 'bg-sky-500',
    'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={cn(
      'flex items-center justify-center rounded-full font-bold text-white shrink-0',
      color,
      size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
    )}>
      {initials}
    </div>
  )
}

// ─── Activity Icon ─────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const map = {
    request: { icon: <MessageSquare className="h-3 w-3" />, bg: 'bg-violet-500' },
    subscription: { icon: <CreditCard className="h-3 w-3" />, bg: 'bg-emerald-500' },
    post: { icon: <Calendar className="h-3 w-3" />, bg: 'bg-sky-500' },
    client: { icon: <Users className="h-3 w-3" />, bg: 'bg-amber-500' },
  }
  const { icon, bg } = map[type]
  return (
    <div className={cn('flex h-5 w-5 items-center justify-center rounded-full text-white', bg)}>
      {icon}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const supabase = createClient()

  const [stats, setStats] = useState<Stats>({ clients: 0, pendingRequests: 0, activeSubscriptions: 0, scheduledPosts: 0 })
  const [requests, setRequests] = useState<RecentRequest[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Current user name
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles').select('full_name').eq('id', user.id).single()
          setUserName(profile?.full_name?.split(' ')[0] ?? 'Admin')
        }

        // Stats in parallel
        const [
          { count: clientCount },
          { count: pendingCount },
          { count: activeSubCount },
          { count: scheduledCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
          supabase.from('requests').select('*', { count: 'exact', head: true })
            .not('status_id', 'is', null),
          supabase.from('client_subscriptions').select('*', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabase.from('posts').select('*', { count: 'exact', head: true })
            .eq('status', 'scheduled'),
        ])

        setStats({
          clients: clientCount ?? 0,
          pendingRequests: pendingCount ?? 0,
          activeSubscriptions: activeSubCount ?? 0,
          scheduledPosts: scheduledCount ?? 0,
        })

        // Recent requests with status join
        const { data: reqs } = await supabase
          .from('requests')
          .select(`
            id, title, type, created_at,
            profiles!requests_client_id_fkey (full_name, company_name),
            request_statuses (name, color)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (reqs) {
          setRequests(reqs.map((r: any) => ({
            id: r.id,
            title: r.title,
            clientName: r.profiles?.company_name ?? r.profiles?.full_name ?? '—',
            type: r.type,
            statusName: r.request_statuses?.name ?? '—',
            statusColor: r.request_statuses?.color ?? '#888',
            createdAt: r.created_at,
          })))
        }

        // Activity: latest clients + requests + posts
        const [{ data: newClients }, { data: newPosts }, { data: newReqs }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, company_name, created_at')
            .eq('role', 'client').order('created_at', { ascending: false }).limit(3),
          supabase.from('posts').select('id, title, created_at, profiles!posts_client_id_fkey(full_name, company_name)')
            .order('created_at', { ascending: false }).limit(3),
          supabase.from('requests').select('id, title, created_at, profiles!requests_client_id_fkey(full_name, company_name)')
            .order('created_at', { ascending: false }).limit(3),
        ])

        const items: ActivityItem[] = [
          ...(newClients ?? []).map((c: any) => ({
            id: 'c-' + c.id, type: 'client' as const,
            clientName: c.company_name ?? c.full_name ?? 'Cliente',
            action: 'Nuevo cliente registrado',
            date: c.created_at,
          })),
          ...(newPosts ?? []).map((p: any) => ({
            id: 'p-' + p.id, type: 'post' as const,
            clientName: p.profiles?.company_name ?? p.profiles?.full_name ?? 'Cliente',
            action: `Post creado: "${p.title}"`,
            date: p.created_at,
          })),
          ...(newReqs ?? []).map((r: any) => ({
            id: 'r-' + r.id, type: 'request' as const,
            clientName: r.profiles?.company_name ?? r.profiles?.full_name ?? 'Cliente',
            action: `Solicitud: "${r.title}"`,
            date: r.created_at,
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

        setActivity(items)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const metrics = [
    {
      title: 'Clientes Activos',
      value: stats.clients,
      icon: <Users className="h-5 w-5" />,
      gradient: 'bg-gradient-to-r from-violet-500 to-indigo-500',
      description: 'Clientes registrados',
      trend: 12,
    },
    {
      title: 'Solicitudes',
      value: stats.pendingRequests,
      icon: <MessageSquare className="h-5 w-5" />,
      gradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
      description: 'Total en sistema',
    },
    {
      title: 'Suscripciones',
      value: stats.activeSubscriptions,
      icon: <CreditCard className="h-5 w-5" />,
      gradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      description: 'Planes activos',
      trend: 8,
    },
    {
      title: 'Posts Programados',
      value: stats.scheduledPosts,
      icon: <Calendar className="h-5 w-5" />,
      gradient: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      description: 'Listos para publicar',
    },
  ]

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `Hace ${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `Hace ${h}h`
    return `Hace ${Math.floor(h / 24)}d`
  }

  const typeLabel = (type: string) => ({
    page_change: 'Cambio de página',
    new_product: 'Nuevo producto',
    design: 'Diseño',
    other: 'Otro',
  }[type] ?? type)

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {loading ? 'Cargando...' : `Bienvenido de vuelta, ${userName} 👋`}
          </p>
          <h1 className="text-4xl font-black tracking-tight">
            <AnimatedGradientText colorFrom="#d86226" colorTo="#7e230c" speed={0.8}>
              Dashboard
            </AnimatedGradientText>
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <Activity className="h-4 w-4 text-emerald-500" />
          Sistema operando con normalidad
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.title} {...m} />
        ))}
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Recent Requests — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                <MessageSquare className="h-4 w-4 text-violet-500" />
              </div>
              <h2 className="font-semibold text-sm">Solicitudes Recientes</h2>
            </div>
            <span className="text-xs text-muted-foreground">{requests.length} registros</span>
          </div>

          <div className="divide-y divide-border/40">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2 w-48 rounded bg-muted" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 opacity-40" />
                <p className="text-sm">Sin solicitudes aún</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <Avatar name={req.clientName} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{req.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs hidden sm:flex">
                      {typeLabel(req.type)}
                    </Badge>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: req.statusColor }}
                    >
                      {req.statusName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10">
                <Zap className="h-4 w-4 text-sky-500" />
              </div>
              <h2 className="font-semibold text-sm">Actividad Reciente</h2>
            </div>
          </div>

          <div className="px-6 py-4 space-y-5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-2 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-40" />
                <p className="text-sm">Sin actividad reciente</p>
              </div>
            ) : (
              activity.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3">
                  {/* timeline line */}
                  <div className="relative flex flex-col items-center">
                    <Avatar name={item.clientName} size="sm" />
                    {idx < activity.length - 1 && (
                      <div className="absolute top-8 h-5 w-px bg-border/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ActivityIcon type={item.type} />
                      <p className="text-xs font-semibold">{item.clientName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.action}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      {timeAgo(item.date)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Stats bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tasa de retención', value: '94%', icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, color: 'text-emerald-600' },
          { label: 'Satisfacción', value: '4.8/5', icon: <CheckCircle2 className="h-4 w-4 text-sky-500" />, color: 'text-sky-600' },
          { label: 'Tiempo resp. prom.', value: '2h', icon: <Clock className="h-4 w-4 text-amber-500" />, color: 'text-amber-600' },
          { label: 'Uptime del mes', value: '99.9%', icon: <Activity className="h-4 w-4 text-violet-500" />, color: 'text-violet-600' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm">
            {s.icon}
            <div>
              <p className={cn('text-sm font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
