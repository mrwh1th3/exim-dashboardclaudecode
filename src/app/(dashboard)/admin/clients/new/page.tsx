'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NewClientPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceType, setServiceType] = useState<string>('')
  const [flowTemplateId, setFlowTemplateId] = useState<string>('')
  const [planId, setPlanId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const [flowTemplates, setFlowTemplates] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])

  const [createdPassword, setCreatedPassword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data: flows } = await supabase
        .from('flow_templates')
        .select('id, name, type, is_active')
        .eq('is_active', true)
      setFlowTemplates(flows ?? [])

      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id, name, price, currency, interval')
        .eq('is_active', true)
        .order('price', { ascending: true })
      setPlans(planData ?? [])
    })()
  }, [])

  const filteredFlows = flowTemplates.filter((f) => {
    if (!serviceType) return true
    if (serviceType === 'ambos') return true
    return f.type === serviceType
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email) {
      toast.error('Por favor completa los campos requeridos')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, companyName, phone, flowTemplateId, planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error creando cliente')
        return
      }
      setCreatedPassword(data.tempPassword)
      setDialogOpen(true)
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Email: ${email}\nContraseña temporal: ${createdPassword}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Registra un nuevo cliente en el sistema</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Nombre del cliente"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de empresa</Label>
                <Input
                  id="companyName"
                  placeholder="Mi Empresa S.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+52 55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de servicio</Label>
              <Select
                value={serviceType}
                onValueChange={(val) => {
                  setServiceType(val)
                  const matching = flowTemplates.filter(
                    (f) => f.is_active && (val === 'ambos' || f.type === val)
                  )
                  setFlowTemplateId(matching.length === 1 ? matching[0].id : '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="social">Redes Sociales</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Flujo de onboarding</Label>
              <Select value={flowTemplateId} onValueChange={setFlowTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un flujo" />
                </SelectTrigger>
                <SelectContent>
                  {filteredFlows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name} ({flow.type === 'web' ? 'Web' : 'Social'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {flowTemplateId && filteredFlows.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  Flujo asignado automáticamente por tipo de servicio
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Plan de suscripción</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — ${plan.price} {plan.currency}/
                      {plan.interval === 'monthly' ? 'mes' : 'año'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) router.push('/admin/clients')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cliente creado exitosamente</DialogTitle>
            <DialogDescription>
              Comparte estas credenciales con <strong>{fullName}</strong> para que pueda acceder al dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border p-4 font-mono text-sm bg-muted/30">
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span>{email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Contraseña temporal: </span>
              <span className="font-bold">{createdPassword}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            El cliente deberá cambiar su contraseña al ingresar por primera vez.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Copiado' : 'Copiar credenciales'}
            </Button>
            <Button className="flex-1" onClick={() => router.push('/admin/clients')}>
              Ir a clientes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
