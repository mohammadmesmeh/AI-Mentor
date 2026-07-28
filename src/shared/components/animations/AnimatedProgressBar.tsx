"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type AnimatedProgressBarProps = {
  value: number
  className?: string
  duration?: number
  delay?: number
  once?: boolean
  ariaLabel?: string
  ariaValuenow?: number
  ariaValuemin?: number
  ariaValuemax?: number
}

const EASE_OUT_SOFT = [0.16, 1, 0.3, 1] as const

function AnimatedProgressBar({
  value,
  className,
  duration = 1.2,
  delay = 0.5,
  once = true,
  ariaLabel = "Progress",
  ariaValuenow,
  ariaValuemin = 0,
  ariaValuemax = 100,
}: AnimatedProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      className={cn("progress-track", className)}
      role="progressbar"
      aria-valuenow={ariaValuenow ?? Math.round(clamped)}
      aria-valuemin={ariaValuemin}
      aria-valuemax={ariaValuemax}
      aria-label={ariaLabel}
    >
      <motion.div
        className="progress-fill"
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once }}
        transition={{ duration, delay, ease: EASE_OUT_SOFT }}
      />
    </div>
  )
}

export { AnimatedProgressBar }