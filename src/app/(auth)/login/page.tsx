'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      const user = useAuthStore.getState().user
      toast.success(`Bienvenido, ${user?.fullName}`)
      router.push(user?.role === 'client' ? '/client' : '/admin')
    } else {
      toast.error(result.error ?? 'Credenciales incorrectas')
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'oklch(0.14 0 0)' }}>

      {/* ── Left Panel: Brand ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:flex-[0_0_58%] flex-col items-center justify-center overflow-hidden">

        {/* Line grid */}
        <div className="absolute inset-0 bg-line-grid" />

        {/* Primary glow — bottom left */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-160px', left: '-160px', width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.47 0.22 264 / 15%) 0%, transparent 65%)',
          }}
        />
        {/* Primary glow — top right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-100px', right: '-100px', width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.47 0.22 264 / 8%) 0%, transparent 65%)',
          }}
        />

        {/* Brand content */}
        <div className="relative z-10 flex flex-col items-center text-center select-none px-16 animate-fade-up">
          {/* Wordmark */}
          <span
            className="text-foreground leading-none tracking-tighter animate-fade-up"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(6rem, 12vw, 11rem)',
              textShadow: '0 0 120px oklch(0.47 0.22 264 / 25%)',
            }}
          >
            EXIM
          </span>

          {/* Amber divider */}
          <div
            className="mt-6 animate-fade-up anim-delay-200"
            style={{ width: '64px', height: '2px', background: 'oklch(0.47 0.22 264)' }}
          />

          {/* Tagline */}
          <p
            className="mt-5 text-muted-foreground uppercase tracking-widest animate-fade-up anim-delay-300"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.35em' }}
          >
            Agencia Digital · Panel de Control
          </p>

          {/* Feature pills */}
          <div className="mt-12 flex flex-col gap-3 w-full max-w-xs animate-fade-up anim-delay-400">
            {[
              { dot: 'oklch(0.47 0.22 264)', label: 'Gestión de clientes en tiempo real' },
              { dot: 'oklch(0.65 0.13 175)', label: 'Calendarios de redes sociales' },
              { dot: 'oklch(0.62 0.20 25)',  label: 'Control de suscripciones Stripe' },
            ].map(({ dot, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                style={{ background: 'oklch(1 0 0 / 4%)', border: '1px solid oklch(1 0 0 / 7%)' }}
              >
                <span className="shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                <span
                  className="text-muted-foreground"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ─────────────────────────────────────────── */}
      <div
        className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16"
        style={{ background: 'oklch(0.12 0 0)', borderLeft: '1px solid oklch(1 0 0 / 6%)' }}
      >
        <div className="w-full max-w-[360px] animate-fade-up anim-delay-100">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div
              className="flex h-9 w-9 items-center justify-center"
              style={{
                background: 'oklch(0.47 0.22 264)',
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                color: 'oklch(0.98 0 0)',
              }}
            >
              E
            </div>
            <span
              className="text-foreground"
              style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.05em' }}
            >
              EXIM
            </span>
          </div>

          {/* Heading */}
          <h1
            className="text-foreground leading-none mb-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', letterSpacing: '0.02em' }}
          >
            INICIAR
            <br />
            SESIÓN
          </h1>
          <p
            className="text-muted-foreground mb-10"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em' }}
          >
            Ingresa tus credenciales para acceder
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-muted-foreground uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em' }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    padding: '0.65rem 0',
                    border: 'none',
                    borderBottom: '1px solid oklch(1 0 0 / 12%)',
                  }}
                  onFocus={e => (e.target.style.borderBottomColor = 'oklch(0.47 0.22 264)')}
                  onBlur={e => (e.target.style.borderBottomColor = 'oklch(1 0 0 / 12%)')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-muted-foreground uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em' }}
                >
                  Contraseña
                </label>
                <a
                  href="/forgot-password"
                  className="text-muted-foreground transition-colors hover:text-primary"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 outline-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  padding: '0.65rem 0',
                  border: 'none',
                  borderBottom: '1px solid oklch(1 0 0 / 12%)',
                  transition: 'border-bottom-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderBottomColor = 'oklch(0.47 0.22 264)')}
                onBlur={e => (e.target.style.borderBottomColor = 'oklch(1 0 0 / 12%)')}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full transition-all duration-200 active:scale-[0.98]"
              style={{
                background: isLoading ? 'oklch(0.38 0.16 264)' : 'oklch(0.47 0.22 264)',
                color: 'oklch(0.98 0 0)',
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                letterSpacing: '0.08em',
                padding: '0.9rem 1.5rem',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 0 32px oklch(0.47 0.22 264 / 30%)',
              }}
              onMouseEnter={e => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 48px oklch(0.47 0.22 264 / 50%)'
              }}
              onMouseLeave={e => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px oklch(0.47 0.22 264 / 30%)'
              }}
            >
              {isLoading ? 'INGRESANDO...' : 'INGRESAR →'}
            </button>
          </form>

          {/* Footer */}
          <p
            className="mt-10 text-muted-foreground/50 text-center"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}
          >
            © {new Date().getFullYear()} EXIM · TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>
    </div>
  )
}
