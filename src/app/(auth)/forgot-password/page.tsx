'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

type Step = 'email' | 'otp' | 'done'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<Step>('email')

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Se envió el código de verificación a tu email')
    setStep('otp')
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6) {
      toast.error('Ingresa el código completo de 6 dígitos')
      return
    }
    toast.success('Código verificado correctamente')
    setStep('done')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            E
          </div>
          <h1 className="text-2xl font-bold">Exim Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar Contraseña</CardTitle>
            <CardDescription>
              {step === 'email' && 'Te enviaremos un código de verificación'}
              {step === 'otp' && `Ingresa el código enviado a ${email}`}
              {step === 'done' && 'Revisa tu bandeja de entrada'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleSendEmail} className="space-y-4">
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
                <Button type="submit" className="w-full">
                  Enviar código
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Ingresa el código de 6 dígitos que enviamos a tu email
                  </p>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full" disabled={otp.length < 6}>
                  Verificar código
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep('email'); setOtp('') }}
                >
                  Cambiar email
                </Button>
              </form>
            )}

            {step === 'done' && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Te enviamos un enlace para restablecer tu contraseña a{' '}
                  <strong>{email}</strong>
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setStep('email'); setOtp('') }}>
                  Enviar de nuevo
                </Button>
              </div>
            )}

            <div className="mt-4">
              <Link href="/login" className="flex items-center gap-1 text-sm text-primary hover:underline justify-center">
                <ArrowLeft size={14} />
                Volver al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
