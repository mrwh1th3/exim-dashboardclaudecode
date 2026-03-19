import { PageHeaderSkeleton, FormSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function FlowEditorLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[15px] border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-16 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-[15px]" />
    </div>
  )
}
