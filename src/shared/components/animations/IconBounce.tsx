"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface IconBounceProps {
  children: ReactNode
  className?: string
}

function IconBounce({ children, className }: IconBounceProps) {
  return (
    <motion.span
      className={cn("inline-flex items-center justify-center", className)}
      whileHover={{
        scale: 1.2,
        rotate: [0, -8, 8, -4, 4, 0],
        transition: {
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1],
        },
      }}
      whileTap={{ scale: 0.9 }}
    >
      {children}
    </motion.span>
  )
}

export { IconBounce, type IconBounceProps }