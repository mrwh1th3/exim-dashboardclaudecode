'use client'

import { useMemo, useRef, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/ui/number-ticker'

export interface StatsWidgetProps {
  title: string
  value: number | string
  /** Percentage trend — positive = up, negative = down */
  change?: number
  /** Sparkline data in 0-100 scale. Defaults to flat line if omitted. */
  chartData?: number[]
  prefix?: string
  suffix?: string
  description?: string
  /** Hex or CSS color override for the sparkline and accent. */
  accentColor?: string
  className?: string
}

const generateSmoothPath = (points: number[], w: number, h: number): string => {
  if (points.length < 2) return `M 0 ${h}`
  const step = w / (points.length - 1)
  const pts = points.map((v, i): [number, number] => [
    i * step,
    h - (v / 100) * (h * 0.8) - h * 0.1,
  ])
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const mx = (x1 + x2) / 2
    d += ` C ${mx},${y1} ${mx},${y2} ${x2},${y2}`
  }
  return d
}

export function StatsWidget({
  title,
  value,
  change,
  chartData,
  prefix = '',
  suffix = '',
  description,
  accentColor,
  className,
}: StatsWidgetProps) {
  const lineRef = useRef<SVGPathElement>(null)
  const areaRef = useRef<SVGPathElement>(null)

  const W = 150
  const H = 60
  const data = chartData ?? Array(7).fill(50)
  const hasChange = change !== undefined
  const isPos = (change ?? 0) >= 0

  const strokeColor =
    accentColor ?? (hasChange ? (isPos ? '#22c55e' : '#f97316') : '#8b5cf6')

  // Stable gradient ID — must not change between renders
  const uid = useMemo(
    () => `sw-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
    [title]
  )

  const linePath = useMemo(() => generateSmoothPath(data, W, H), [data])
  const areaPath = useMemo(
    () => `${linePath} L ${W} ${H} L 0 ${H} Z`,
    [linePath]
  )

  // Draw animation on mount / data change
  useEffect(() => {
    const line = lineRef.current
    const area = areaRef.current
    if (!line || !area) return
    const len = line.getTotalLength()
    line.style.transition = 'none'
    line.style.strokeDasharray = `${len} ${len}`
    line.style.strokeDashoffset = String(len)
    area.style.transition = 'none'
    area.style.opacity = '0'
    // Force reflow
    line.getBoundingClientRect()
    line.style.transition = 'stroke-dashoffset 0.8s ease-in-out'
    line.style.strokeDashoffset = '0'
    area.style.transition = 'opacity 0.8s ease-in-out 0.2s'
    area.style.opacity = '1'
  }, [linePath])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card text-card-foreground p-5 transition-all duration-300 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: label + trend + value */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <p
            className="text-muted-foreground uppercase truncate"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
            }}
          >
            {title}
          </p>

          {hasChange && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold w-fit',
                isPos ? 'text-green-500' : 'text-orange-500'
              )}
            >
              {Math.abs(change!)}%
              {isPos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            </span>
          )}

          <p
            className="text-foreground leading-none mt-1"
            style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem' }}
          >
            {prefix}
            {typeof value === 'number' ? <NumberTicker value={value} /> : value}
            {suffix}
          </p>

          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {/* Right: sparkline chart */}
        <div className="w-[38%] h-14 shrink-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path ref={areaRef} d={areaPath} fill={`url(#${uid})`} />
            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
