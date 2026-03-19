'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const barRef = useRef<HTMLDivElement>(null)
  const prevRef = useRef(pathname)

  useEffect(() => {
    if (prevRef.current === pathname) return
    prevRef.current = pathname

    const bar = barRef.current
    if (!bar) return

    // Reset
    bar.style.transition = 'none'
    bar.style.opacity = '1'
    bar.style.width = '0%'

    // Animate to 80%
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = 'width 0.35s cubic-bezier(0.16,1,0.32,1)'
        bar.style.width = '80%'

        // Complete + fade
        setTimeout(() => {
          bar.style.transition =
            'width 0.2s ease, opacity 0.4s ease'
          bar.style.width = '100%'
          setTimeout(() => {
            bar.style.opacity = '0'
          }, 180)
        }, 250)
      })
    })
  }, [pathname])

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[2px]"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          opacity: 0,
          background: '#a5d2c8',
          boxShadow: '0 0 12px 1px rgba(165,210,200,0.6)',
        }}
      />
    </div>
  )
}
