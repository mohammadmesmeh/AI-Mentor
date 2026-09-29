"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { toneFill, type StatusTone } from "./status-tone"

/** shadcn Progress in the workspace style: a rounded track and a status-colored fill. */
export function ProgressBar({
  value,
  label,
  valueText,
  tone = "completed",
  size = "md",
  className,
}: {
  /** 0–100. */
  value: number
  /** Accessible name; the bar is announced as "{label}, {valueText}". */
  label: string
  valueText?: string
  tone?: StatusTone
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <Progress
      value={value}
      aria-label={label}
      getAriaValueText={valueText ? () => valueText : undefined}
      className={cn("gap-0", className)}
      trackClassName={cn("rounded-full bg-track", size === "sm" ? "h-2" : "h-2.5")}
      indicatorClassName={cn("rounded-full motion-reduce:transition-none", toneFill[tone])}
    />
  )
}
