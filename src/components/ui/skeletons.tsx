import { Skeleton } from '@/components/ui/skeleton'

// ── Page header ──────────────────────────────────────────────────────────────
export function PageHeaderSkeleton({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {hasButton && <Skeleton className="h-9 w-32 rounded-[15px]" />}
    </div>
  )
}

// ── Stats cards row ───────────────────────────────────────────────────────────
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[15px] border bg-card p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-[10px]" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function TableSkeleton({
  rows = 6,
  cols = 4,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <div className="rounded-[15px] border bg-card overflow-hidden">
      {/* Table header */}
      <div className="border-b bg-muted/30 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5" style={{ width: `${80 + i * 20}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0"
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4"
              style={{ width: `${60 + j * 30 + Math.random() * 40}px` }}
            />
          ))}
          <Skeleton className="h-6 w-16 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  )
}

// ── Card grid ─────────────────────────────────────────────────────────────────
export function CardGridSkeleton({
  count = 6,
  cols = 3,
}: {
  count?: number
  cols?: number
}) {
  const gridClass =
    cols === 2
      ? 'grid gap-4 sm:grid-cols-2'
      : cols === 4
      ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[15px] border bg-card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="rounded-[15px] border bg-card p-6 space-y-5 max-w-2xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-9 w-24 rounded-[10px]" />
        <Skeleton className="h-9 w-28 rounded-[10px]" />
      </div>
    </div>
  )
}

// ── Detail page (2-col: sidebar + content) ────────────────────────────────────
export function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Sidebar */}
      <div className="rounded-[15px] border bg-card p-5 space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-5 w-36 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
        <div className="border-t pt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-[15px] border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <TableSkeleton rows={4} cols={3} />
        </div>
      </div>
    </div>
  )
}

// ── Full page composite skeletons ─────────────────────────────────────────────

export function ListPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      {/* Search/filter bar */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64 rounded-[10px]" />
        <Skeleton className="h-9 w-32 rounded-[10px]" />
      </div>
      <TableSkeleton rows={7} cols={5} />
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasButton={false} />
      <StatCardsSkeleton count={4} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TableSkeleton rows={5} cols={4} />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[15px] border bg-card p-4 flex gap-3 items-start">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} cols={3} />
    </div>
  )
}
