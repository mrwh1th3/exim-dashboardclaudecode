import { cn } from "@/lib/utils"

type SpinnerProps = {
  size?: string
} & Omit<React.ComponentProps<"div">, "size">

export function Spinner({
  size = "size-6",
  className,
  ...props
}: SpinnerProps) {
  const bars = Array(12).fill(0)

  return (
    <div className={cn(size)}>
      <div className="relative top-1/2 left-1/2 h-[inherit] w-[inherit]">
        {bars.map((_, i) => (
          <div
            key={`spinner-bar-${String(i)}`}
            aria-label={`spinner-bar-${i + 1}`}
            className={cn(
              "-left-[10%] -top-[3.9%] absolute h-[8%] w-[24%] animate-[spinner_1.2s_linear_infinite] rounded-md bg-foreground opacity-[calc((12-var(--i))/12)]",
              className
            )}
            style={{
              animationDelay: `-${1.3 - i * 0.1}s`,
              transform: `rotate(${30 * i}deg) translate(146%)`,
            }}
            {...props}
          />
        ))}
      </div>
    </div>
  )
}
