"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface OptionCardProps {
  title: string
  description?: string
  selected: boolean
  onClick: () => void
  className?: string
  children?: ReactNode
}

function OptionCard({
  title,
  description,
  selected,
  onClick,
  className,
  children,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-xl border bg-card p-5 text-start shadow-sm transition-all duration-200 cursor-pointer",
        "hover:border-primary/40 hover:shadow-md",
        selected
          ? "border-primary/60 bg-primary/[0.05] ring-1 ring-primary/20"
          : "border-border",
        className,
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground">{title}</div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {children}
        </div>
        {selected && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        )}
      </div>
    </motion.button>
  )
}

export { OptionCard, type OptionCardProps }
