"use client"

import { useRef, type ReactNode } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface RevealImageProps {
  children: ReactNode
  className?: string
  direction?: "left" | "right" | "center"
  delay?: number
}

function RevealImage({
  children,
  className,
  direction = "center",
  delay = 0,
}: RevealImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const clipPathStart =
    direction === "center"
      ? "inset(50% 50% 50% 50% round 12px)"
      : direction === "left"
        ? "inset(0 100% 0 0 round 12px)"
        : "inset(0 0 0 100% round 12px)"

  const clipPathEnd = "inset(0 0 0 0 round 12px)"

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        className="relative"
        initial={{
          clipPath: clipPathStart,
          scale: 1.08,
        }}
        animate={
          isInView
            ? {
                clipPath: clipPathEnd,
                scale: 1,
              }
            : {
                clipPath: clipPathStart,
                scale: 1.08,
              }
        }
        transition={{
          duration: 0.9,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        whileHover={{
          scale: 1.02,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export { RevealImage, type RevealImageProps }