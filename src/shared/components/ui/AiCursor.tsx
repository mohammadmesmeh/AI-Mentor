"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"

type HoverState = "normal" | "text" | "clickable"

const TEXT_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "H5", "H6",
  "SPAN", "LI", "LABEL", "CODE", "BLOCKQUOTE",
  "INPUT", "TEXTAREA", "SELECT",
])

const CLICKABLE_TAGS = new Set(["A", "BUTTON"])

function getHoverState(target: EventTarget | null): HoverState {
  if (!(target instanceof HTMLElement)) return "normal"

  if (CLICKABLE_TAGS.has(target.tagName)) return "clickable"
  if (target.closest?.("a, button, [data-cursor-hover]")) return "clickable"

  if (TEXT_TAGS.has(target.tagName)) return "text"
  if (target.closest?.("p, h1, h2, h3, h4, h5, h6, span, li, label, code, blockquote, input, textarea, select, [data-cursor-text]"))
    return "text"

  return "normal"
}

function getCSSVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

interface CursorVars {
  dotSize: number
  ringSize: number
  ringHoverSize: number
  ringPointerSize: number
  ringOpacity: number
  ringHoverOpacity: number
  ringPointerOpacity: number
}

function AiCursor() {
  const [hoverState, setHoverState] = useState<HoverState>("normal")
  const [visible, setVisible] = useState(false)
  const [vars, setVars] = useState<CursorVars>({
    dotSize: 4,
    ringSize: 28,
    ringHoverSize: 44,
    ringPointerSize: 22,
    ringOpacity: 0.45,
    ringHoverOpacity: 0.6,
    ringPointerOpacity: 0.7,
  })
  const isTouchDevice = useRef(false)

  const cursorX = useMotionValue(-200)
  const cursorY = useMotionValue(-200)

  const ringX = useSpring(cursorX, { damping: 22, stiffness: 280, mass: 0.35 })
  const ringY = useSpring(cursorY, { damping: 22, stiffness: 280, mass: 0.35 })

  const dotX = useSpring(cursorX, { damping: 30, stiffness: 500, mass: 0.15 })
  const dotY = useSpring(cursorY, { damping: 30, stiffness: 500, mass: 0.15 })

  useEffect(() => {
    isTouchDevice.current = window.matchMedia("(pointer: coarse)").matches
    if (isTouchDevice.current) return

    setVars({
      dotSize: parseInt(getCSSVar("--cursor-dot-size", "4")) || 4,
      ringSize: parseInt(getCSSVar("--cursor-ring-size", "28")) || 28,
      ringHoverSize: parseInt(getCSSVar("--cursor-ring-hover-size", "44")) || 44,
      ringPointerSize: parseInt(getCSSVar("--cursor-ring-pointer-size", "22")) || 22,
      ringOpacity: parseFloat(getCSSVar("--cursor-ring-opacity", "0.45")) || 0.45,
      ringHoverOpacity: parseFloat(getCSSVar("--cursor-ring-hover-opacity", "0.6")) || 0.6,
      ringPointerOpacity: parseFloat(getCSSVar("--cursor-ring-pointer-opacity", "0.7")) || 0.7,
    })

    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return

    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    const handleOver = (e: MouseEvent) => {
      setHoverState(getHoverState(e.target))
    }

    window.addEventListener("mousemove", handleMove, { passive: true })
    window.addEventListener("mouseover", handleOver, { passive: true })

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseover", handleOver)
    }
  }, [visible, cursorX, cursorY])

  const isText = hoverState === "text"
  const isClickable = hoverState === "clickable"

  if (!visible) return null

  const easing = [0.16, 1, 0.3, 1] as const

  const ringWidth = isText ? vars.ringHoverSize : isClickable ? vars.ringPointerSize : vars.ringSize
  const ringOpacity = isText ? vars.ringHoverOpacity : isClickable ? vars.ringPointerOpacity : vars.ringOpacity
  const dotScale = isText ? 0 : isClickable ? 1.25 : 1
  const dotOpacity = isText ? 0 : 1

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border will-change-transform"
        aria-hidden="true"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          borderColor: "var(--cursor-color)",
          borderWidth: "1.5px",
        }}
        animate={{
          width: ringWidth,
          height: ringWidth,
          opacity: ringOpacity,
          backgroundColor: isClickable ? "var(--cursor-color)" : "transparent",
        }}
        transition={{
          width: { duration: 0.35, ease: easing },
          height: { duration: 0.35, ease: easing },
          opacity: { duration: 0.25 },
          backgroundColor: { duration: 0.2 },
        }}
      />

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full will-change-transform"
        aria-hidden="true"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
          width: vars.dotSize,
          height: vars.dotSize,
          backgroundColor: "var(--cursor-color)",
        }}
        animate={{
          scale: dotScale,
          opacity: dotOpacity,
          boxShadow: isClickable
            ? "var(--cursor-glow), 0 0 0 4px var(--cursor-glow-color)"
            : "var(--cursor-glow)",
        }}
        transition={{
          scale: { duration: 0.2, ease: easing },
          opacity: { duration: 0.15 },
          boxShadow: { duration: 0.25 },
        }}
      />

      <AnimatePresence>
        {isText && (
          <motion.div
            key="text-accent"
            className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
            aria-hidden="true"
            style={{
              x: ringX,
              y: ringY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: easing }}
          >
            <div
              className="h-5 w-0.5 rounded-full"
              style={{
                backgroundColor: "var(--cursor-color)",
                boxShadow: "0 0 10px var(--cursor-color)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export { AiCursor }
