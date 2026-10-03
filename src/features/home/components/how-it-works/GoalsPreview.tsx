"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

const LEVELS = ["beginner", "intermediate", "advanced"] as const
const TIMES = ["min30", "h1", "h2", "h5"] as const
const SELECTED_LEVEL = 1
const SELECTED_TIME = 2

// Timeline (ms): the goal types itself, then the level and the time get
// picked, then "Ready" shows — about 3.5 s in all, once.
const START_DELAY = 400
const TYPE_STEP = 55
const LEVEL_AFTER_TYPING = 450
const TIME_AFTER_LEVEL = 650
const READY_AFTER_TIME = 650

type Phase = "idle" | "typing" | "level" | "time" | "ready"

/** Grapheme clusters, so Arabic letters keep their marks (e.g. the shadda in مطوّر) while typing. */
function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
  }
  return Array.from(text)
}

/**
 * A decorative preview of the onboarding questions for the How it works
 * step-01 card: goal, level, weekly time, then "Ready". It plays once when it
 * scrolls into view; with reduced motion it shows the final state. It is
 * aria-hidden and has nothing focusable — the card's heading and text are the
 * accessible content. Direction comes from the page (logical properties only).
 */
function GoalsPreview({ className }: { className?: string }) {
  const t = useTranslations("howItWork.preview")
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduceMotion = useReducedMotion()

  const goal = t("goalText")
  const letters = useMemo(() => graphemes(goal), [goal])
  const [phase, setPhase] = useState<Phase>("idle")
  const [typed, setTyped] = useState(0)

  useEffect(() => {
    if (reduceMotion || !inView) return
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    at(START_DELAY, () => setPhase("typing"))
    letters.forEach((_, i) => at(START_DELAY + (i + 1) * TYPE_STEP, () => setTyped(i + 1)))
    const typedAt = START_DELAY + letters.length * TYPE_STEP
    at(typedAt + LEVEL_AFTER_TYPING, () => setPhase("level"))
    at(typedAt + LEVEL_AFTER_TYPING + TIME_AFTER_LEVEL, () => setPhase("time"))
    at(typedAt + LEVEL_AFTER_TYPING + TIME_AFTER_LEVEL + READY_AFTER_TIME, () => setPhase("ready"))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [inView, reduceMotion, letters])

  // Reduced motion: the final state, straight away.
  const final = reduceMotion === true
  const shown = final ? letters.length : typed
  const stage = final ? "ready" : phase
  const levelPicked = stage === "level" || stage === "time" || stage === "ready"
  const timePicked = stage === "time" || stage === "ready"
  const ready = stage === "ready"
  const typing = stage === "typing" && shown < letters.length

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative space-y-3.5 rounded-xl border border-section-card-edge bg-section-card-hover p-4 shadow-card sm:p-5",
        className
      )}
    >
      <PreviewRow label={t("goalLabel")}>
        <div className="input flex min-h-10 items-center border-primary-500 px-3.5 py-2 text-sm text-ink">
          <span>{letters.slice(0, shown).join("")}</span>
          <span
            className={cn(
              "ms-px inline-block h-4.5 w-0.5 shrink-0 rounded-full bg-primary-500",
              typing ? "opacity-100" : "motion-safe:animate-caret-blink"
            )}
          />
        </div>
      </PreviewRow>

      {/* On phones the card gets tall: the level row is the first to go. */}
      <PreviewRow label={t("levelLabel")} className="max-sm:hidden">
        <ChipRow>
          {LEVELS.map((level, i) => (
            <Chip key={level} selected={levelPicked && i === SELECTED_LEVEL}>
              {t(`levels.${level}`)}
            </Chip>
          ))}
        </ChipRow>
      </PreviewRow>

      <PreviewRow label={t("timeLabel")}>
        <ChipRow>
          {TIMES.map((time, i) => (
            <Chip key={time} selected={timePicked && i === SELECTED_TIME}>
              {t(`times.${time}`)}
            </Chip>
          ))}
        </ChipRow>
      </PreviewRow>

      <div className="flex items-center justify-between gap-3 pt-1.5">
        <Mascot className="size-10" />
        <span
          className={cn(
            "inline-flex items-center gap-2 text-sm font-bold text-success-700 transition-opacity duration-500 dark:text-success-green",
            ready ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="flex size-5.5 items-center justify-center rounded-full bg-success-green text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          {t("ready")}
        </span>
      </div>
    </div>
  )
}

function PreviewRow({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="m-0 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5 sm:gap-2">{children}</div>
}

/** The onboarding's option, drawn as a small pill. */
function Chip({ selected, children }: { selected: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 text-[0.8125rem] sm:px-3.5 font-semibold transition-colors duration-300",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-default bg-card text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

/**
 * The bubble mascot: the logo's dot, with eyes. Never mirrored — only its
 * place in the row follows the reading direction.
 */
function Mascot({ className }: { className?: string }) {
  const id = useId()
  const gradient = `${id}-dot`
  return (
    <svg viewBox="0 0 40 40" focusable="false" className={cn("shrink-0 overflow-visible", className)}>
      <defs>
        <radialGradient id={gradient} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" style={{ stopColor: "var(--color-hero-mark-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-hero-mark-4)" }} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#${gradient})`} className="drop-shadow-sm" />
      <ellipse cx="15" cy="17" rx="3.4" ry="4" className="fill-white" />
      <ellipse cx="25" cy="17" rx="3.4" ry="4" className="fill-white" />
      <circle cx="15.6" cy="17.8" r="1.8" className="fill-midnight" />
      <circle cx="25.6" cy="17.8" r="1.8" className="fill-midnight" />
      <ellipse cx="20" cy="26" rx="1.8" ry="1.5" className="fill-midnight" />
    </svg>
  )
}

export { GoalsPreview }
