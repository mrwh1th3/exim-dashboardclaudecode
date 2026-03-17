"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import {
  AnimatePresence,
  motion,
  type Variants,
  MotionConfig,
} from "motion/react"
import useMeasure from "react-use-measure"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function MultiStepModal({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="multi-step-modal" {...props} />
}

function MultiStepModalTrigger({
  asChild,
  children,
  ...props
}: DialogPrimitive.Trigger.Props & { asChild?: boolean }) {
  if (asChild && children && typeof children === "object") {
    return (
      <DialogPrimitive.Trigger
        data-slot="multi-step-modal-trigger"
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <DialogPrimitive.Trigger data-slot="multi-step-modal-trigger" {...props}>
      {children}
    </DialogPrimitive.Trigger>
  )
}

function MultiStepModalClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="multi-step-modal-close" {...props} />
}

type MultiStepModalStep = {
  title: string
  description: string
}

type MultiStepModalContentProps = DialogPrimitive.Popup.Props & {
  steps: MultiStepModalStep[]
}

function MultiStepModalContent({ steps, className, ...props }: MultiStepModalContentProps) {
  const TOTAL_STEPS = steps.length
  const MIN_STEP = 0

  const [activeContentIndex, setActiveContentIndex] = useState(MIN_STEP)
  const [direction, setDirection] = useState<number>(1)
  const [ref, { height: heightContent }] = useMeasure()

  const { title, description } = steps[activeContentIndex]

  function handleControlsNavigation(control: "previous" | "next") {
    const newDirection = control === "next" ? 1 : -1
    setDirection(newDirection)

    setActiveContentIndex((prev) => {
      const nextIndex = prev + newDirection
      return Math.min(TOTAL_STEPS - 1, Math.max(MIN_STEP, nextIndex))
    })
  }

  const slideMotionVariants: Variants = {
    initial: (dir: number) => ({
      x: `${110 * dir}%`,
      opacity: 0,
      height: heightContent > 0 ? heightContent : "auto",
    }),
    active: {
      x: "0%",
      opacity: 1,
      height: heightContent > 0 ? heightContent : "auto",
    },
    exit: (dir: number) => ({
      x: `${-110 * dir}%`,
      opacity: 0,
    }),
  }

  return (
    <MotionConfig transition={{ type: "spring", duration: 0.6, bounce: 0 }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="multi-step-modal-overlay"
          className="fixed inset-0 isolate z-50 bg-black/50 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          data-slot="multi-step-modal-content"
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10 duration-100 outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <div className="px-4 pt-4 pb-3">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <motion.div
                key={activeContentIndex}
                variants={slideMotionVariants}
                initial="initial"
                animate="active"
                exit="exit"
                custom={direction}
              >
                <div ref={ref} className="flex flex-col gap-2">
                  <DialogPrimitive.Title className="text-base font-medium leading-none text-foreground">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeContentIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <footer className="flex items-center justify-between border-t border-border px-4 py-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleControlsNavigation("previous")}
              disabled={activeContentIndex === MIN_STEP}
            >
              Atrás
            </Button>

            {activeContentIndex === TOTAL_STEPS - 1 ? (
              <DialogPrimitive.Close
                render={<Button size="sm" />}
              >
                Finalizar
              </DialogPrimitive.Close>
            ) : (
              <Button
                size="sm"
                onClick={() => handleControlsNavigation("next")}
              >
                Continuar
              </Button>
            )}
          </footer>

          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </MotionConfig>
  )
}

export {
  MultiStepModal,
  MultiStepModalTrigger,
  MultiStepModalClose,
  MultiStepModalContent,
}
