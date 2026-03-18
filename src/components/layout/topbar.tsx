'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { usePathname, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Shield, UserCog, UserCircle } from 'lucide-react'
import { UserRole } from '@/types/auth'
import { ProfileDialog } from '@/components/shared/profile-dialog'

function getBreadcrumb(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const labels: Record<string, string> = {
    admin: 'Admin',
    client: 'Portal',
    clients: 'Clientes',
    onboarding: 'Flujos',
    requests: 'Solicitudes',
    subscriptions: 'Suscripciones',
    subscription: 'Suscripción',
    social: 'Redes Sociales',
    calendar: 'Calendario',
    posts: 'Posts',
    strategy: 'Estrategia',
    settings: 'Configuración',
    statuses: 'Estados',
    new: 'Nuevo',
    web: 'Página Web',
    files: 'Archivos',
  }

  return segments
    .map((s) => labels[s] || s)
    .join(' / ')
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  client: 'Cliente',
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-orange-900/30 text-orange-400',
  editor: 'bg-amber-900/30 text-amber-400',
  client: 'bg-emerald-900/30 text-emerald-400',
}

export function Topbar() {
  const { user, setRole, logout } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm text-muted-foreground">{getBreadcrumb(pathname)}</h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Dev role switcher */}
        <div className="flex items-center gap-1 rounded-[15px] border px-2 py-1">
          <span className="text-xs text-muted-foreground mr-1">Rol:</span>
          {(['admin', 'editor', 'client'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => {
                setRole(role)
                router.push(role === 'client' ? '/client' : '/admin')
              }}
              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                user?.role === role
                  ? roleColors[role]
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.fullName}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {user?.role ? roleLabels[user.role] : ''}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.fullName}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <User size={16} className="mr-2" />
              Mi Perfil
            </DropdownMenuItem>
            {user?.role !== 'client' && (
              <>
                <DropdownMenuItem onClick={() => { setRole('admin'); router.push('/admin') }}>
                  <Shield size={16} className="mr-2" />
                  Vista Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setRole('editor'); router.push('/admin') }}>
                  <UserCog size={16} className="mr-2" />
                  Vista Editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setRole('client'); router.push('/client') }}>
                  <UserCircle size={16} className="mr-2" />
                  Vista Cliente
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); router.push('/login') }}>
              <LogOut size={16} className="mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  )
}
