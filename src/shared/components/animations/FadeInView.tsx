"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FadeInViewProps {
  children: ReactNode
  as?: "div" | "p" | "span" | "section"
  className?: string
  delay?: number
  once?: boolean
}

const motionTag: Record<string, typeof motion.div | typeof motion.p | typeof motion.span | typeof motion.section> = {
  div: motion.div,
  p: motion.p,
  span: motion.span,
  section: motion.section,
}

function FadeInView({
  children,
  as = "div",
  className,
  delay = 0,
  once = true,
}: FadeInViewProps) {
  const Tag = motionTag[as]

  return (
    <Tag
      className={cn(className)}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.9,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      viewport={{ once, margin: "-40px" }}
    >
      {children}
    </Tag>
  )
}

export { FadeInView, type FadeInViewProps }