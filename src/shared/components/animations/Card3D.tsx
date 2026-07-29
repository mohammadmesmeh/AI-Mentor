"use client"

import {
  useRef,
  type ReactNode,
  useCallback,
  useState,
} from "react"
import { motion, useMotionValue, useSpring, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface Card3DProps {
  children: ReactNode
  className?: string
  intensity?: number
  shadowIntensity?: number
}

function Card3D({
  children,
  className,
  intensity = 8,
  shadowIntensity = 0.3,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  const [isHovered, setIsHovered] = useState(false)

  const rotateX = useSpring(0, { damping: 20, stiffness: 250 })
  const rotateY = useSpring(0, { damping: 20, stiffness: 250 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const posX = (e.clientX - centerX) / (rect.width / 2)
      const posY = (e.clientY - centerY) / (rect.height / 2)

      rotateX.set(-posY * intensity)
      rotateY.set(posX * intensity)

      mouseX.set(posX)
      mouseY.set(posY)
    },
    [intensity, mouseX, mouseY, rotateX, rotateY]
  )

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }, [mouseX, mouseY, rotateX, rotateY])

  const shadowX = useSpring(0, { damping: 20, stiffness: 250 })
  const shadowY = useSpring(0, { damping: 20, stiffness: 250 })

  const handleMouseMoveShadow = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return

      const posX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const posY = ((e.clientY - rect.top) / rect.height - 0.5) * 2

      shadowX.set(-posX * 12)
      shadowY.set(-posY * 12)
    },
    [shadowX, shadowY]
  )

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(4px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, y: 24, scale: 0.96, filter: "blur(4px)" }
      }
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={(e) => {
        handleMouseMove(e)
        handleMouseMoveShadow(e)
        setIsHovered(true)
      }}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
        rotateX: rotateX,
        rotateY: rotateY,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? shadowIntensity : 0,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(0,0,0,0.2)",
          x: shadowX,
          y: shadowY,
          filter: "blur(4px)",
        }}
        aria-hidden="true"
      />

      <div
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </motion.div>
  )
}

export { Card3D, type Card3DProps }