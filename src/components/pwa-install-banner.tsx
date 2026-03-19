'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'exim-pwa-dismissed'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // No mostrar si ya está instalada o fue descartada
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (ios) {
      // En iOS no hay beforeinstallprompt, mostrar instrucciones manual
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const timer = setTimeout(() => setShowBanner(true), 1500)
      return () => clearTimeout(timer)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setShowBanner(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setInstalling(false)
    setDeferredPrompt(null)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.32, 1] }}
          className="mt-8 w-full rounded-[15px] p-4"
          style={{
            background: 'oklch(0.16 0.02 180 / 0.7)',
            border: '1px solid oklch(0.65 0.08 180 / 0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style={{ background: 'oklch(0.65 0.08 180 / 0.15)' }}
            >
              <Smartphone size={18} style={{ color: '#a5d2c8' }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className="leading-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.05em',
                  color: '#a5d2c8',
                }}
              >
                Instalar Exim App
              </p>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.03em',
                  color: 'oklch(0.65 0 0)',
                  lineHeight: 1.5,
                }}
              >
                {isIOSDevice
                  ? 'Toca el botón compartir y luego "Agregar a pantalla de inicio" para instalar la app.'
                  : 'Accede más rápido desde tu dispositivo sin necesidad de abrir el navegador.'}
              </p>

              {!isIOSDevice && (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="mt-3 flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60"
                  style={{
                    background: '#a5d2c8',
                    color: 'oklch(0.12 0 0)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.07em',
                    boxShadow: '0 0 20px rgba(165,210,200,0.2)',
                  }}
                >
                  <Download size={13} />
                  {installing ? 'INSTALANDO...' : 'DESCARGAR APP'}
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="shrink-0 rounded-[8px] p-1 transition-colors hover:bg-white/5"
              aria-label="Cerrar"
            >
              <X size={15} style={{ color: 'oklch(0.5 0 0)' }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
