"use client"

import { useRef, type ReactNode, useCallback } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

interface MagneticBehaviorProps {
  children: ReactNode
  className?: string
  strength?: number
}

function MagneticBehavior({
  children,
  className,
  strength = 0.4,
}: MagneticBehaviorProps) {
  const ref = useRef<HTMLDivElement>(null)

  const motionX = useMotionValue(0)
  const motionY = useMotionValue(0)

  const springX = useSpring(motionX, { damping: 15, stiffness: 300, mass: 0.3 })
  const springY = useSpring(motionY, { damping: 15, stiffness: 300, mass: 0.3 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distX = e.clientX - centerX
      const distY = e.clientY - centerY

      const maxDist = Math.max(rect.width, rect.height)

      const pullX = (distX / maxDist) * strength * rect.width
      const pullY = (distY / maxDist) * strength * rect.height

      motionX.set(pullX)
      motionY.set(pullY)
    },
    [motionX, motionY, strength]
  )

  const handleMouseLeave = useCallback(() => {
    motionX.set(0)
    motionY.set(0)
  }, [motionX, motionY])

  return (
    <motion.div
      ref={ref}
      className={cn("inline-flex", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
      }}
    >
      {children}
    </motion.div>
  )
}

export { MagneticBehavior, type MagneticBehaviorProps }