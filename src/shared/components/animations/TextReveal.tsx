"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  p: motion.p,
  span: motion.span,
  div: motion.div,
} as const

type AsTag = keyof typeof motionTags

export type TextRevealProps = {
  children: ReactNode
  as?: AsTag
  className?: string
  id?: string
  delay?: number
  duration?: number
  once?: boolean
}

const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/

function hasRTL(text: string): boolean {
  return RTL_RE.test(text)
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  return ""
}

function TextReveal({
  children,
  as: tag = "div",
  className,
  id,
  delay = 0,
  duration = 0.7,
  once = true,
}: TextRevealProps) {
  const text = extractText(children)
  const isRTL = hasRTL(text)
  const MotionTag = motionTags[tag]

  return (
    <MotionTag
      className={cn(className)}
      id={id}
      dir={isRTL ? "rtl" : undefined}
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
          duration,
          delay,
          ease: "easeOut",
        },
      }}
      viewport={{ once }}
    >
      {children}
    </MotionTag>
  )
}

export { TextReveal }
