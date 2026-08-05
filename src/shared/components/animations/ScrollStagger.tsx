"use client"

import { useRef, type ReactNode } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface ScrollStaggerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
  direction?: "up" | "down" | "left" | "right" | "fade"
  once?: boolean
}

function ScrollStagger({
  children,
  className,
  delay = 0,
  staggerDelay = 0.1,
  direction = "up",
  once = true,
}: ScrollStaggerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: "-60px" })

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 24 }
      case "down":
        return { opacity: 0, y: -24 }
      case "left":
        return { opacity: 0, x: 24 }
      case "right":
        return { opacity: 0, x: -24 }
      case "fade":
        return { opacity: 0 }
    }
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={getInitial()}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              x: 0,
            }
          : getInitial()
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}

export { ScrollStagger, type ScrollStaggerProps }