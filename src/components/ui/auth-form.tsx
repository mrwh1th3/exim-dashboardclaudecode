"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github, Twitter } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

const AuthForm: React.FC = () => {
  return (
    <div
      className="min-h-screen py-20 selection:bg-[#a5d2c8]/30"
      style={{ background: 'oklch(0.12 0 0)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.25, ease: "easeInOut" }}
        className="relative z-10 mx-auto w-full max-w-xl p-4"
      >
        <Logo />
        <Header />
        <SocialButtons />
        <Divider />
        <LoginForm />
        <TermsAndConditions />
      </motion.div>
      <BackgroundDecoration />
    </div>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  isLoading?: boolean
}

const Button: React.FC<ButtonProps> = ({ children, className, isLoading, ...props }) => (
  <button
    className={`rounded-[15px] px-4 py-3 text-lg ring-2 ring-[#a5d2c8]/50 ring-offset-2
    transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-[#a5d2c8]/70
    disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    style={{
      background: isLoading ? '#7ab8aa' : '#a5d2c8',
      color: 'oklch(0.12 0 0)',
      fontFamily: 'var(--font-display)',
      fontSize: '1.15rem',
      letterSpacing: '0.08em',
      boxShadow: isLoading ? 'none' : '0 0 32px rgba(165, 210, 200, 0.3)',
      '--tw-ring-offset-color': 'oklch(0.12 0 0)',
    } as React.CSSProperties}
    {...props}
  >
    {children}
  </button>
)

const Logo: React.FC = () => (
  <div className="mb-6 flex justify-center items-center gap-3">
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[15px]"
      style={{
        background: '#a5d2c8',
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        color: 'oklch(0.12 0 0)',
      }}
    >
      E
    </div>
    <span
      className="text-foreground"
      style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.05em' }}
    >
      EXIM
    </span>
  </div>
)

const Header: React.FC = () => (
  <div className="mb-6 text-center">
    <h1
      className="text-foreground leading-none"
      style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.02em' }}
    >
      Inicia sesión en tu cuenta
    </h1>
    <p
      className="mt-3 text-muted-foreground"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}
    >
      ¿No tienes una cuenta?{" "}
      <a href="#" className="text-[#a5d2c8] hover:underline">
        Crea una.
      </a>
    </p>
  </div>
)

const SocialButtons: React.FC = () => (
  <div className="mb-6 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <SocialButton icon={<Twitter size={20} />} />
      <SocialButton icon={<Github size={20} />} />
      <SocialButton fullWidth>Iniciar con SSO</SocialButton>
    </div>
  </div>
)

const SocialButton: React.FC<{
  icon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}> = ({ icon, fullWidth, children }) => (
  <button
    className={`btn-sweep flex items-center justify-center gap-2 rounded-[15px]
    px-4 py-2.5 font-semibold transition-all duration-300
    hover:scale-105 active:scale-95
    ${fullWidth ? "col-span-2" : ""}`}
    style={{
      background: 'oklch(0.18 0 0)',
      border: '1px solid oklch(1 0 0 / 10%)',
      color: 'oklch(0.79 0.008 82)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
    }}
  >
    {icon}
    <span>{children}</span>
  </button>
)

const Divider: React.FC = () => (
  <div className="my-6 flex items-center gap-3">
    <div className="h-[1px] w-full" style={{ background: 'oklch(1 0 0 / 10%)' }} />
    <span
      className="text-muted-foreground uppercase"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em' }}
    >
      O
    </span>
    <div className="h-[1px] w-full" style={{ background: 'oklch(1 0 0 / 10%)' }} />
  </div>
)

const LoginForm: React.FC = () => {
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
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label
          htmlFor="email-input"
          className="mb-2 block text-muted-foreground uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em' }}
        >
          Email
        </label>
        <input
          id="email-input"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-[15px] px-3 py-2.5 text-foreground
          placeholder:text-muted-foreground/40
          ring-1 ring-transparent transition-all focus:outline-0 focus:ring-[#a5d2c8]"
          style={{
            background: 'oklch(0.16 0 0)',
            border: '1px solid oklch(1 0 0 / 10%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
          }}
        />
      </div>
      <div className="mb-6">
        <div className="mb-2 flex items-end justify-between">
          <label
            htmlFor="password-input"
            className="block text-muted-foreground uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em' }}
          >
            Contraseña
          </label>
          <a
            href="/forgot-password"
            className="text-[#a5d2c8] transition-colors hover:text-[#a5d2c8]/80"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
          >
            ¿Olvidaste?
          </a>
        </div>
        <input
          id="password-input"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-[15px] px-3 py-2.5 text-foreground
          placeholder:text-muted-foreground/40
          ring-1 ring-transparent transition-all focus:outline-0 focus:ring-[#a5d2c8]"
          style={{
            background: 'oklch(0.16 0 0)',
            border: '1px solid oklch(1 0 0 / 10%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
          }}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
        {isLoading ? 'INGRESANDO...' : 'INGRESAR'}
      </Button>
    </form>
  )
}

const TermsAndConditions: React.FC = () => (
  <p
    className="mt-9 text-center text-muted-foreground/60"
    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.05em' }}
  >
    Al iniciar sesión, aceptas nuestros{" "}
    <a href="#" className="text-[#a5d2c8] hover:underline">
      Términos y Condiciones
    </a>{" "}
    y nuestra{" "}
    <a href="#" className="text-[#a5d2c8] hover:underline">
      Política de Privacidad.
    </a>
  </p>
)

const BackgroundDecoration: React.FC = () => {
  return (
    <div
      className="absolute right-0 top-0 z-0 size-[50vw] pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke-width='2' stroke='rgb(165 210 200 / 0.3)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(100% 100% at 100% 0%, transparent, oklch(0.12 0 0))",
        }}
      />
    </div>
  )
}

export default AuthForm
