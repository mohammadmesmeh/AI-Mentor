"use client"

import { useRef, type ElementType } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

interface HeadingRevealProps {
  children: string
  as?: HeadingTag
  className?: string
  id?: string
  delay?: number
}

const tagMap: Record<HeadingTag, ElementType> = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
}

function HeadingReveal({
  children,
  as = "h2",
  className,
  id,
  delay = 0,
}: HeadingRevealProps) {
  const Tag = tagMap[as]
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const words = children.split(" ")

  return (
    <div ref={ref} className="overflow-hidden">
      <Tag
        id={id}
        className={cn("inline-flex flex-wrap gap-x-[0.25em]", className)}
        aria-label={children}
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="relative inline-block overflow-hidden">
            <motion.span
              className="inline-block"
              initial={{ y: "100%", rotateX: -60 }}
              animate={
                isInView
                  ? { y: 0, rotateX: 0 }
                  : { y: "100%", rotateX: -60 }
              }
              transition={{
                duration: 0.7,
                delay: delay + i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </Tag>
    </div>
  )
}

export { HeadingReveal, type HeadingRevealProps }