"use client"

import * as React from "react"
import * as RadixAccordion from "@radix-ui/react-accordion"
import { PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = RadixAccordion.Root

type AccordionItemProps = React.ComponentProps<typeof RadixAccordion.Item>

function AccordionItem({
  children,
  value,
  className,
  ...props
}: AccordionItemProps) {
  return (
    <RadixAccordion.Item
      value={value}
      className={cn(
        "w-full overflow-hidden border-b border-border last:border-none focus-within:relative focus-within:z-10",
        className
      )}
      {...props}
    >
      {children}
    </RadixAccordion.Item>
  )
}

type AccordionTriggerProps = React.ComponentProps<typeof RadixAccordion.Trigger>

function AccordionTrigger({
  children,
  className,
  ...props
}: AccordionTriggerProps) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        className={cn(
          "group flex h-11 w-full items-center justify-between px-3.5 text-sm font-medium text-foreground outline-none transition-all",
          "[&[data-state=open]>svg]:rotate-45",
          className
        )}
        {...props}
      >
        {children}
        <PlusIcon
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
        />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  )
}

type AccordionContentProps = React.ComponentProps<typeof RadixAccordion.Content>

function AccordionContent({
  children,
  className,
  ...props
}: AccordionContentProps) {
  return (
    <RadixAccordion.Content
      className={cn(
        "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="px-3.5 pb-3 text-muted-foreground">{children}</div>
    </RadixAccordion.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
