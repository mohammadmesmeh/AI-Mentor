"use client"

import type { ReactNode } from "react"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  /** The section's name, next to the brand mark. */
  eyebrow: string
  /**
   * The h2. Rich text: one key phrase wrapped in `<mark>` in the translation,
   * rendered through `sectionHighlight` — e.g.
   * `t.rich("title", { mark: sectionHighlight })`.
   */
  title: ReactNode
  description?: string
  /** Matches the section's `aria-labelledby`. */
  headingId?: string
  className?: string
}

/**
 * The brand mark from the logo: a navy dot and two blue chevrons. It points
 * forward, so it mirrors in RTL. Decorative.
 */
function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 30 18"
      width={30}
      height={18}
      fill="none"
      className="shrink-0 rtl:-scale-x-100"
    >
      <circle cx="4" cy="9" r="4" className="fill-primary-900 dark:fill-secondary-200" />
      <path
        d="M12 3.5 17.5 9 12 14.5M20.5 3.5 26 9l-5.5 5.5"
        className="stroke-secondary-500"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The highlighted phrase of a section title: a real `<mark>` with a soft-blue
 * background behind the words. `box-decoration-clone` keeps the rounded,
 * padded shape on every line if the phrase wraps. The vertical padding is
 * tuned per script so the highlight sits evenly around the letters (Zain's
 * content box is much taller above the letters than Nunito's).
 */
function sectionHighlight(chunks: ReactNode) {
  return <mark className="section-highlight">{chunks}</mark>
}

/**
 * The header every landing section opens with, aligned to the start:
 * brand mark + section name, the h2 with one highlighted phrase, and an
 * optional one-color description. No bars, rules or gradients.
 *
 * One fade for the whole block (the word-by-word reveal can't carry the rich
 * title); framer-motion's reduced-motion setting turns it off.
 */
function SectionHeader({ eyebrow, title, description, headingId, className }: SectionHeaderProps) {
  return (
    <FadeInView as="div" className={cn("flex flex-col items-start gap-3.5 text-start", className)}>
      <p className="m-0! flex items-center gap-2.5 text-[0.9375rem] leading-normal! font-semibold text-secondary-700 dark:text-secondary-300">
        <BrandMark />
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className="m-0! font-display text-3xl leading-[1.25] font-extrabold tracking-normal text-ink rtl:leading-[1.5] lg:text-[2.75rem]"
      >
        {title}
      </h2>
      {description && (
        <p className="m-0! max-w-[38.75rem] text-lg leading-relaxed! text-text-secondary">{description}</p>
      )}
    </FadeInView>
  )
}

export { SectionHeader, sectionHighlight, type SectionHeaderProps }
