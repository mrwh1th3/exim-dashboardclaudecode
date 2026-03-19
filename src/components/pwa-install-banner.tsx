'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'exim-pwa-dismissed'

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // No mostrar si ya está instalada
    if (isInStandaloneMode()) return
    // No mostrar si fue descartada
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY)) return

    setIsIOSDevice(isIOS())

    // Escuchar el evento de instalación nativo (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Mostrar el banner siempre después de un delay (independiente del evento)
    const timer = setTimeout(() => setShowBanner(true), 1800)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setShowBanner(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setInstalling(false)
    setDeferredPrompt(null)
  }

  const ios = isIOSDevice

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.32, 1] }}
          className="mt-8 w-full overflow-hidden rounded-[15px]"
          style={{
            background: 'oklch(0.15 0.015 180 / 0.85)',
            border: '1px solid oklch(0.65 0.08 180 / 0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[2px] w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, #a5d2c8, transparent)',
            }}
          />

          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] mt-0.5"
              style={{ background: 'oklch(0.65 0.08 180 / 0.12)' }}
            >
              <Smartphone size={17} style={{ color: '#a5d2c8' }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  letterSpacing: '0.06em',
                  color: '#a5d2c8',
                  lineHeight: 1,
                }}
              >
                Instalar Exim App
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.67rem',
                  letterSpacing: '0.02em',
                  color: 'oklch(0.55 0 0)',
                  lineHeight: 1.55,
                }}
              >
                {ios
                  ? 'Toca el ícono de compartir'
                  : 'Accede directo desde tu pantalla de inicio.'}
                {ios && (
                  <span style={{ color: 'oklch(0.65 0 0)' }}>
                    {' '}
                    <Share
                      size={10}
                      style={{ display: 'inline', verticalAlign: 'middle' }}
                    />{' '}
                    y luego "Agregar a inicio".
                  </span>
                )}
              </p>

              {/* Install button — only show if native prompt available OR not iOS */}
              {!ios && (
                <button
                  onClick={deferredPrompt ? handleInstall : undefined}
                  disabled={installing || !deferredPrompt}
                  className="mt-3 flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: deferredPrompt ? '#a5d2c8' : 'oklch(0.65 0.08 180 / 0.15)',
                    color: deferredPrompt ? 'oklch(0.12 0 0)' : '#a5d2c8',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    boxShadow: deferredPrompt
                      ? '0 0 20px rgba(165,210,200,0.25)'
                      : 'none',
                    border: deferredPrompt
                      ? 'none'
                      : '1px solid oklch(0.65 0.08 180 / 0.3)',
                  }}
                >
                  <Download size={12} />
                  {installing
                    ? 'INSTALANDO...'
                    : deferredPrompt
                    ? 'DESCARGAR APP'
                    : 'ABRE EN CHROME PARA INSTALAR'}
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="shrink-0 rounded-[8px] p-1.5 transition-colors hover:bg-white/5"
              aria-label="Cerrar"
            >
              <X size={14} style={{ color: 'oklch(0.45 0 0)' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
