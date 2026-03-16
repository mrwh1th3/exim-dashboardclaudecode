'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  LayoutDashboard,
  Users,
  GitBranch,
  MessageSquare,
  CreditCard,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ClipboardList,
  Home,
  Send,
  Eye,
  BarChart3,
  Globe,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Clientes', href: '/admin/clients', icon: <Users size={20} /> },
  { label: 'Flujos', href: '/admin/onboarding', icon: <GitBranch size={20} /> },
  { label: 'Solicitudes', href: '/admin/requests', icon: <MessageSquare size={20} /> },
  { label: 'Suscripciones', href: '/admin/subscriptions', icon: <CreditCard size={20} /> },
]

const adminSocialNav: NavItem[] = [
  { label: 'Calendario', href: '/admin/social/calendar', icon: <Calendar size={20} /> },
  { label: 'Posts', href: '/admin/social/posts', icon: <Megaphone size={20} /> },
  { label: 'Estrategia', href: '/admin/social/strategy', icon: <BarChart3 size={20} /> },
  { label: 'Archivos', href: '/admin/social/files', icon: <FolderOpen size={20} /> },
]

const adminSettingsNav: NavItem[] = [
  { label: 'Configuración', href: '/admin/settings', icon: <Settings size={20} /> },
  { label: 'Estados', href: '/admin/settings/statuses', icon: <ClipboardList size={20} /> },
]

const clientNav: NavItem[] = [
  { label: 'Inicio', href: '/client', icon: <Home size={20} /> },
  { label: 'Onboarding', href: '/client/onboarding', icon: <GitBranch size={20} /> },
  { label: 'Solicitudes', href: '/client/requests', icon: <Send size={20} /> },
  { label: 'Suscripción', href: '/client/subscription', icon: <CreditCard size={20} /> },
]

const clientSocialNav: NavItem[] = [
  { label: 'Calendario', href: '/client/social/calendar', icon: <Calendar size={20} /> },
  { label: 'Estrategia', href: '/client/social/strategy', icon: <Eye size={20} /> },
  { label: 'Archivos', href: '/client/social/files', icon: <FolderOpen size={20} /> },
]

const adminWebNav: NavItem[] = [
  { label: 'Páginas', href: '/admin/web', icon: <Globe size={20} /> },
  { label: 'Archivos', href: '/admin/web/files', icon: <FolderOpen size={20} /> },
]

const clientWebNav: NavItem[] = [
  { label: 'Mi Página', href: '/client/web', icon: <Globe size={20} /> },
  { label: 'Archivos', href: '/client/web/files', icon: <FolderOpen size={20} /> },
]

function NavLink({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/client' && pathname.startsWith(item.href))

  const link = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      {item.icon}
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  )

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore()
  const user = useAuthStore((s) => s.user)
  const isClient = user?.role === 'client'

  const mainNav = isClient ? clientNav : adminNav
  const socialNav = isClient ? clientSocialNav : adminSocialNav
  const webNav = isClient ? clientWebNav : adminWebNav

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-14 items-center border-b px-4', isCollapsed && 'justify-center px-2')}>
        <Link href={isClient ? '/client' : '/admin'} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white font-bold text-sm">
            E
          </div>
          {!isCollapsed && <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-wide">Exim</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}

        <div className="py-2">
          <Separator />
          {!isCollapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Redes Sociales
            </p>
          )}
        </div>

        {socialNav.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}

        <div className="py-2">
          <Separator />
          {!isCollapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Página Web
            </p>
          )}
        </div>

        {webNav.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
        ))}

        {!isClient && (
          <>
            <div className="py-2">
              <Separator />
              {!isCollapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sistema
                </p>
              )}
            </div>
            {adminSettingsNav.map((item) => (
              <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', isCollapsed && 'px-2')}
          onClick={toggle}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span className="ml-2">Colapsar</span>}
        </Button>
      </div>
    </aside>
  )
}
