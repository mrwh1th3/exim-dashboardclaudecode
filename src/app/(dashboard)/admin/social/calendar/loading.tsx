import { PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      {/* Calendar grid */}
      <div className="rounded-[15px] border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d} className="p-3 text-center">
              <Skeleton className="h-3.5 w-4 mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="border-r border-b last:border-r-0 p-2 min-h-[80px] space-y-1">
                <Skeleton className="h-3.5 w-5" />
                {Math.random() > 0.6 && (
                  <Skeleton className="h-5 w-full rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
