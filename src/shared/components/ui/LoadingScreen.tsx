"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Brain } from "lucide-react"
import { cn } from "@/lib/utils"

const easeOutSoft = [0.16, 1, 0.3, 1] as const

interface LoadingScreenProps {
  isLoading?: boolean
  minDisplayTime?: number
  className?: string
  text?: string
}

function LoadingScreen({
  isLoading = true,
  minDisplayTime = 1200,
  className,
  text = "Loading",
}: LoadingScreenProps) {
  const isVisible = isLoading

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="loading-screen"
          className={cn(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
            "bg-[var(--bg-base)]",
            className
          )}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: easeOutSoft }}
          role="status"
          aria-label="Loading"
        >
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: easeOutSoft,
              }}
              className="ai-glow animate-glow-pulse flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-card)]"
            >
              <Brain className="h-8 w-8 text-[var(--color-primary-500)]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: easeOutSoft,
              }}
              className="mt-6"
              dir="ltr"
            >
              <span className="gradient-text font-display text-2xl font-bold tracking-tight">
                AI Mentor
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.5,
                ease: easeOutSoft,
              }}
              className="mt-8"
              style={{ transformOrigin: "center" }}
            >
              <div className="relative h-0.5 w-40 overflow-hidden rounded-full bg-[var(--border-default)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--color-primary-500), var(--color-accent-500))",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 1.2,
                    delay: 0.6,
                    ease: easeOutSoft,
                  }}
                />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
               className="font-ui mt-4 text-body-sm text-[var(--text-muted)]"
            >
              {text}
              <AnimatedDot delay={0} />
              <AnimatedDot delay={0.2} />
              <AnimatedDot delay={0.4} />
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AnimatedDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block"
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      .
    </motion.span>
  )
}

export { LoadingScreen }
