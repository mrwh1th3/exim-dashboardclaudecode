'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Check, RefreshCw, Loader2, Link } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface StripeCustomer {
  customerId: string
  customerName: string | null
  customerEmail: string | null
  subscriptionId: string
  priceId: string | null
  planName: string
  amount: number
  currency: string
  intervalLabel: string
}

export default function NewClientPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceType, setServiceType] = useState<string>('')
  const [flowTemplateId, setFlowTemplateId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const [flowTemplates, setFlowTemplates] = useState<any[]>([])

  // Stripe link
  const [stripeCustomers, setStripeCustomers] = useState<StripeCustomer[]>([])
  const [loadingStripe, setLoadingStripe] = useState(false)
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [selectedStripeCustomerId, setSelectedStripeCustomerId] = useState<string>('')

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
    })()
  }, [])

  const filteredFlows = flowTemplates.filter((f) => {
    if (!serviceType) return true
    if (serviceType === 'ambos') return true
    return f.type === serviceType
  })

  const loadStripeCustomers = async () => {
    setLoadingStripe(true)
    try {
      const res = await fetch('/api/stripe/customers')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStripeCustomers(data.customers ?? [])
      setStripeLoaded(true)
    } catch (err: any) {
      toast.error(err.message ?? 'Error al cargar clientes de Stripe')
    } finally {
      setLoadingStripe(false)
    }
  }

  const selectedStripeCustomer = stripeCustomers.find(
    (c) => c.customerId === selectedStripeCustomerId,
  )

  const handleStripeSelect = (customerId: string) => {
    setSelectedStripeCustomerId(customerId)
    const customer = stripeCustomers.find((c) => c.customerId === customerId)
    if (customer) {
      if (!email && customer.customerEmail) setEmail(customer.customerEmail)
      if (!fullName && customer.customerName) setFullName(customer.customerName)
    }
  }

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
        body: JSON.stringify({
          fullName,
          email,
          companyName,
          phone,
          flowTemplateId,
          ...(selectedStripeCustomerId ? { stripeCustomerId: selectedStripeCustomerId } : {}),
        }),
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
      `Email: ${email}\nContraseña temporal: ${createdPassword}`,
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

      <div className="grid gap-6 max-w-2xl">
        {/* ── Stripe link card ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Vincular con suscripción de Stripe
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional — selecciona un cliente activo de Stripe para vincularlo automáticamente
                </p>
              </div>
              {!stripeLoaded && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingStripe}
                  onClick={loadStripeCustomers}
                >
                  {loadingStripe
                    ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    : <RefreshCw className="h-3 w-3 mr-1" />
                  }
                  Cargar clientes
                </Button>
              )}
              {stripeLoaded && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loadingStripe}
                  onClick={loadStripeCustomers}
                >
                  <RefreshCw className={`h-3 w-3 ${loadingStripe ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardHeader>

          {stripeLoaded && (
            <CardContent className="space-y-3">
              {stripeCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay clientes con suscripciones activas en Stripe.
                </p>
              ) : (
                <>
                  <Select value={selectedStripeCustomerId} onValueChange={handleStripeSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente de Stripe">
                        {selectedStripeCustomer
                          ? `${selectedStripeCustomer.customerName ?? selectedStripeCustomer.customerEmail} — ${selectedStripeCustomer.planName}`
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {stripeCustomers.map((c) => (
                        <SelectItem key={c.subscriptionId} value={c.customerId}>
                          <div className="flex flex-col py-0.5">
                            <span className="font-medium">
                              {c.customerName ?? c.customerEmail ?? c.customerId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {c.customerEmail} · {c.planName} ${c.amount.toLocaleString()}{' '}
                              {c.currency}{c.intervalLabel}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedStripeCustomer && (
                    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50/10 px-3 py-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {selectedStripeCustomer.customerName ?? selectedStripeCustomer.customerEmail}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedStripeCustomer.planName} · $
                          {selectedStripeCustomer.amount.toLocaleString()}{' '}
                          {selectedStripeCustomer.currency}
                          {selectedStripeCustomer.intervalLabel}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs shrink-0">
                        Activo
                      </Badge>
                    </div>
                  )}

                  {selectedStripeCustomerId && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setSelectedStripeCustomerId('')}
                    >
                      Quitar vinculación
                    </button>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* ── Main form ── */}
        <Card>
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
                      (f) => f.is_active && (val === 'ambos' || f.type === val),
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
                    <SelectValue placeholder="Selecciona un flujo">
                      {flowTemplateId
                        ? filteredFlows.find((f) => f.id === flowTemplateId)?.name
                        : undefined}
                    </SelectValue>
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
      </div>

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
              Comparte estas credenciales con <strong>{fullName}</strong> para que pueda acceder al
              dashboard.
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
          {selectedStripeCustomer && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50/10 px-3 py-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                Vinculado con Stripe: {selectedStripeCustomer.planName} $
                {selectedStripeCustomer.amount.toLocaleString()} {selectedStripeCustomer.currency}
                {selectedStripeCustomer.intervalLabel}
              </span>
            </div>
          )}
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
