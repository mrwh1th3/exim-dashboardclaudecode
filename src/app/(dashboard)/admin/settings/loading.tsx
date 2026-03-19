import { FormSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasButton={false} />
      <FormSkeleton fields={6} />
    </div>
  )
}
