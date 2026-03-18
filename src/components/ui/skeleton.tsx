import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-[15px] bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
