'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Save, Upload } from 'lucide-react'

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('Exim')
  const [companyEmail, setCompanyEmail] = useState('info@exim.com')
  const [notifications, setNotifications] = useState({
    emailOnNewRequest: true,
    emailOnFormSubmission: true,
    emailOnSubscriptionChange: false,
    emailOnPostApproval: true,
  })

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente')
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración General</h2>
        <p className="text-muted-foreground">Administra la configuración de tu empresa</p>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
          <CardDescription>Datos principales que se muestran en el dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nombre de la empresa</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-email">Email de la empresa</Label>
            <Input
              id="company-email"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo de la empresa</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Input type="file" accept="image/*" className="cursor-pointer" />
                <p className="text-xs text-muted-foreground mt-1">PNG, SVG o JPG. Máximo 2MB.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de Notificaciones</CardTitle>
          <CardDescription>Configura qué notificaciones por email deseas recibir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Nueva solicitud</p>
              <p className="text-xs text-muted-foreground">Recibir email cuando un cliente crea una nueva solicitud</p>
            </div>
            <Switch
              checked={notifications.emailOnNewRequest}
              onCheckedChange={() => toggleNotification('emailOnNewRequest')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Formulario completado</p>
              <p className="text-xs text-muted-foreground">Recibir email cuando un cliente envía un formulario de onboarding</p>
            </div>
            <Switch
              checked={notifications.emailOnFormSubmission}
              onCheckedChange={() => toggleNotification('emailOnFormSubmission')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cambio de suscripción</p>
              <p className="text-xs text-muted-foreground">Recibir email cuando cambia el estado de una suscripción</p>
            </div>
            <Switch
              checked={notifications.emailOnSubscriptionChange}
              onCheckedChange={() => toggleNotification('emailOnSubscriptionChange')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Aprobación de post</p>
              <p className="text-xs text-muted-foreground">Recibir email cuando un post requiere aprobación</p>
            </div>
            <Switch
              checked={notifications.emailOnPostApproval}
              onCheckedChange={() => toggleNotification('emailOnPostApproval')}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" />
        Guardar cambios
      </Button>
    </div>
  )
}
