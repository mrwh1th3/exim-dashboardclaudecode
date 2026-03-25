'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import {
  Users, MessageSquare, CreditCard, Calendar,
  Clock, CheckCircle2, AlertCircle, Zap
} from 'lucide-react'
import { StatsWidget } from '@/components/ui/stats-widget'
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


// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['#8B5CF6', '#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold text-white shrink-0',
        size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
      )}
      style={{ background: color }}
    >
      {initials}
    </div>
  )
}

// ─── Activity Icon ─────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const map = {
    request:      { icon: <MessageSquare className="h-3 w-3" />, color: '#8B5CF6' },
    subscription: { icon: <CreditCard className="h-3 w-3" />,    color: '#10B981' },
    post:         { icon: <Calendar className="h-3 w-3" />,       color: '#0EA5E9' },
    client:       { icon: <Users className="h-3 w-3" />,          color: '#F59E0B' },
  }
  const { icon, color } = map[type]
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-full text-white shrink-0"
      style={{ background: color }}
    >
      {icon}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, accent, count }: {
  icon: React.ReactNode; title: string; accent: string; count?: number
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
        <h2
          className="text-foreground"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.05em' }}
        >
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span
          className="text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
        >
          {count} registros
        </span>
      )}
    </div>
  )
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────
function Panel({ children, className, style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl', className)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded animate-pulse bg-muted', className)}
    />
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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles').select('full_name').eq('id', user.id).single()
          setUserName(profile?.full_name?.split(' ')[0] ?? 'Admin')
        }

        const [
          { count: clientCount },
          { count: pendingCount },
          { count: activeSubCount },
          { count: scheduledCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
          supabase.from('requests').select('*', { count: 'exact', head: true }).not('status_id', 'is', null),
          supabase.from('client_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        ])

        setStats({
          clients: clientCount ?? 0,
          pendingRequests: pendingCount ?? 0,
          activeSubscriptions: activeSubCount ?? 0,
          scheduledPosts: scheduledCount ?? 0,
        })

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
            id: r.id, title: r.title,
            clientName: r.profiles?.company_name ?? r.profiles?.full_name ?? '—',
            type: r.type,
            statusName: r.request_statuses?.name ?? '—',
            statusColor: r.request_statuses?.color ?? '#888',
            createdAt: r.created_at,
          })))
        }

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
            action: 'Nuevo cliente registrado', date: c.created_at,
          })),
          ...(newPosts ?? []).map((p: any) => ({
            id: 'p-' + p.id, type: 'post' as const,
            clientName: p.profiles?.company_name ?? p.profiles?.full_name ?? 'Cliente',
            action: `Post: "${p.title}"`, date: p.created_at,
          })),
          ...(newReqs ?? []).map((r: any) => ({
            id: 'r-' + r.id, type: 'request' as const,
            clientName: r.profiles?.company_name ?? r.profiles?.full_name ?? 'Cliente',
            action: `Solicitud: "${r.title}"`, date: r.created_at,
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
      title: 'Clientes Activos', value: stats.clients,
      accentColor: '#8B5CF6', description: 'Clientes registrados', change: 12,
      chartData: [30, 38, 45, 52, 58, 65, 72], className: 'animate-fade-up',
    },
    {
      title: 'Solicitudes', value: stats.pendingRequests,
      accentColor: '#F59E0B', description: 'Total en sistema',
      chartData: [50, 55, 48, 60, 52, 58, 55], className: 'animate-fade-up anim-delay-100',
    },
    {
      title: 'Suscripciones', value: stats.activeSubscriptions,
      accentColor: '#10B981', description: 'Planes activos', change: 8,
      chartData: [35, 42, 48, 55, 60, 65, 70], className: 'animate-fade-up anim-delay-200',
    },
    {
      title: 'Posts Programados', value: stats.scheduledPosts,
      accentColor: '#0EA5E9', description: 'Listos para publicar',
      chartData: [40, 60, 35, 70, 45, 65, 50], className: 'animate-fade-up anim-delay-300',
    },
  ]

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  const typeLabel = (type: string) => ({
    page_change: 'Cambio',
    new_product: 'Producto',
    design: 'Diseño',
    other: 'Otro',
  }[type] ?? type)

  return (
    <div className="space-y-7">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between animate-fade-up">
        <div>
          <p
            className="text-muted-foreground mb-1.5"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            {loading ? '— / —' : `Bienvenido, ${userName}`}
          </p>
          <h1
            className="text-foreground leading-none"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', letterSpacing: '0.02em' }}
          >
            DASHBOARD
          </h1>
        </div>

        <div
          className="hidden sm:flex items-center gap-2 rounded-lg px-4 py-2.5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span
            className="text-muted-foreground"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em' }}
          >
            SISTEMA OPERATIVO
          </span>
        </div>
      </div>

      {/* ── Amber rule line ────────────────────────────────────────────── */}
      <div
        className="animate-fade-in anim-delay-200"
        style={{ height: '1px', background: 'linear-gradient(90deg, oklch(0.47 0.22 264 / 60%), transparent)' }}
      />

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <StatsWidget key={m.title} {...m} />
        ))}
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Recent Requests — 3 cols */}
        <Panel className="lg:col-span-3 animate-fade-up anim-delay-300">
          <SectionHeader
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            title="SOLICITUDES RECIENTES"
            accent="#8B5CF6"
            count={requests.length}
          />

          <div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: '1px solid oklch(1 0 0 / 5%)' }}
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-44" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-sm" />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 opacity-30" />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Sin solicitudes aún</p>
              </div>
            ) : (
              requests.map((req, i) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors"
                  style={{
                    borderBottom: i < requests.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = ''}
                >
                  <Avatar name={req.clientName} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{req.clientName}</p>
                    <p className="truncate text-muted-foreground" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>{req.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="hidden sm:inline-flex items-center rounded-sm px-2 py-0.5 text-muted-foreground"
                      style={{
                        background: 'var(--muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {typeLabel(req.type)}
                    </span>
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-0.5 text-white font-bold"
                      style={{
                        background: req.statusColor,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                      }}
                    >
                      {req.statusName}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        {/* Activity Feed — 2 cols */}
        <Panel className="lg:col-span-2 animate-fade-up anim-delay-400">
          <SectionHeader
            icon={<Zap className="h-3.5 w-3.5" />}
            title="ACTIVIDAD"
            accent="#F59E0B"
          />

          <div className="px-5 py-5 space-y-5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-30" />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Sin actividad reciente</p>
              </div>
            ) : (
              activity.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="relative flex flex-col items-center">
                    <Avatar name={item.clientName} size="sm" />
                    {idx < activity.length - 1 && (
                      <div
                        className="absolute top-8 w-px"
                        style={{ height: '24px', background: 'var(--border)' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ActivityIcon type={item.type} />
                      <p className="text-xs font-semibold text-foreground">{item.clientName}</p>
                    </div>
                    <p className="truncate text-muted-foreground mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                      {item.action}
                    </p>
                    <div
                      className="flex items-center gap-1 mt-1 text-muted-foreground/50"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}
                    >
                      <Clock className="h-3 w-3" />
                      Hace {timeAgo(item.date)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
