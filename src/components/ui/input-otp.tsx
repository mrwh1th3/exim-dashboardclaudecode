"use client"

import { useContext } from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { cn } from "@/lib/utils"

type InputOTPProps = React.ComponentProps<typeof OTPInput>

function InputOTP({ containerClassName, className, ...props }: InputOTPProps) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

type InputOTPGroupProps = React.ComponentProps<"div">

function InputOTPGroup({ className, ...props }: InputOTPGroupProps) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

type InputOTPAnimatedNumberProps = {
  value: string | null
}

function InputOTPAnimatedNumber({ value }: InputOTPAnimatedNumberProps) {
  return (
    <div className="relative flex size-[inherit] items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          data-slot="input-otp-animated-number"
          initial={{ opacity: 0.2, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.09, ease: "easeOut" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

type InputOTPSlotProps = {
  index: number
} & React.ComponentProps<typeof motion.div>

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const inputOTPContext = useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  const activeSlots = inputOTPContext?.slots.filter((slot) => slot.isActive) ?? []
  const isMultiSelect = activeSlots.length > 1

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        data-slot="input-otp-slot"
        className={cn(
          "group relative flex h-10 w-9 items-center justify-center rounded-lg border border-input bg-transparent font-medium text-base text-foreground",
          "aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-2 data-[active=true]:aria-invalid:ring-destructive",
          className
        )}
        {...props}
      >
        {char && <InputOTPAnimatedNumber value={char} />}

        {hasFakeCaret && <FakeCaret />}

        <AnimatePresence mode="wait">
          {isActive && (
            <motion.div
              key={`${isActive}-${isMultiSelect}`}
              layoutId={isMultiSelect ? `indicator-${index}` : "indicator"}
              className="absolute inset-0 z-10 rounded-[inherit] ring-2 ring-ring"
              transition={{ duration: 0.12, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  )
}

type InputOTPSeparatorProps = React.ComponentProps<"div">

function InputOTPSeparator({ className, ...props }: InputOTPSeparatorProps) {
  return (
    <div
      data-slot="input-otp-separator"
      aria-hidden
      className={cn("h-0.5 w-2 rounded-full bg-border", className)}
      {...props}
    />
  )
}

function FakeCaret() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="h-5 w-px animate-[caret-blink_1s_ease-out_infinite] bg-foreground" />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
