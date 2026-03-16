'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateProfile } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    if (user && open) {
      setFullName(user.fullName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setCompanyName(user.companyName || '')
    }
  }, [user, open])

  const initials = fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'

  const handleSave = () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Nombre y correo son requeridos')
      return
    }
    updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      companyName: companyName.trim() || undefined,
    })
    toast.success('Perfil actualizado exitosamente')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
          <DialogDescription>Actualiza tu información personal</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.fullName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              Rol: {user?.role === 'admin' ? 'Administrador' : user?.role === 'editor' ? 'Editor' : 'Cliente'}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nombre completo *</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Correo electrónico *</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Teléfono</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 55 1234 5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-company">Empresa</Label>
            <Input
              id="profile-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nombre de tu empresa"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
