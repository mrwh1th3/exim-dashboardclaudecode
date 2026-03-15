'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) {
      const user = useAuthStore.getState().user
      toast.success(`Bienvenido, ${user?.fullName}`)
      router.push(user?.role === 'client' ? '/client' : '/admin')
    } else {
      toast.error('Credenciales incorrectas')
    }
  }

  const quickLogin = (role: 'admin' | 'editor' | 'client') => {
    const emails = {
      admin: 'admin@exim.com',
      editor: 'editor@exim.com',
      client: 'carlos@empresa1.com',
    }
    setEmail(emails[role])
    setPassword('demo')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            E
          </div>
          <h1 className="text-2xl font-bold">Exim Dashboard</h1>
          <p className="text-sm text-muted-foreground">Gestión de clientes y proyectos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            {/* Quick access for development */}
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground text-center mb-3">Acceso rápido (desarrollo)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => quickLogin('admin')}>
                  Admin
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => quickLogin('editor')}>
                  Editor
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => quickLogin('client')}>
                  Cliente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
