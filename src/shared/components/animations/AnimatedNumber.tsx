"use client"

import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion"
import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export type AnimatedNumberProps = {
  value: number
  suffix?: string
  className?: string
  duration?: number
  delay?: number
  once?: boolean
}

function AnimatedNumber({
  value,
  suffix = "",
  className,
  delay = 0,
  once = true,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once })

  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 25, stiffness: 100 })
  const displayValue = useTransform(spring, (v: number) => Math.round(v))

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => {
        motionValue.set(value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    } else if (!once) {
      motionValue.set(0)
    }
  }, [inView, value, delay, once, motionValue])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  )
}

export { AnimatedNumber }