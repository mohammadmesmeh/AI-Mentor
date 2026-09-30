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
  /** "start" everywhere; "center" is the final CTA's intentional exception. */
  align?: "start" | "center"
  /**
   * "default" follows the theme. "inverse" is for a surface that is navy in
   * both themes (the CTA): white title, light-blue eyebrow, mark and
   * highlighted phrase — the phrase as colored text, with no box behind it.
   */
  tone?: "default" | "inverse"
  className?: string
}

/**
 * The brand mark from the logo: a dot and two chevrons. It points forward, so
 * it mirrors in RTL. Decorative.
 */
function BrandMark({ inverse }: { inverse: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 30 18"
      width={30}
      height={18}
      fill="none"
      className="shrink-0 rtl:-scale-x-100"
    >
      <circle
        cx="4"
        cy="9"
        r="4"
        className={inverse ? "fill-secondary-300" : "fill-primary-900 dark:fill-secondary-200"}
      />
      <path
        d="M12 3.5 17.5 9 12 14.5M20.5 3.5 26 9l-5.5 5.5"
        className={inverse ? "stroke-secondary-300" : "stroke-secondary-500"}
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The highlighted phrase of a section title: a real `<mark>`, so the emphasis
 * still reads as marked text, but colour-only — no background, padding or
 * radius, which on an inline box would sit off-centre on the letters and
 * repaint on every line the phrase wraps onto.
 *
 * Brand blue on the light canvas (secondary-700, 8:1), and the lighter step on
 * navy (secondary-300, 9:1) — reached with `dark`, which an inverse header
 * switches on, so the final CTA's phrase is coloured by its own surface rather
 * than by the app theme it happens to be viewed in.
 */
function sectionHighlight(chunks: ReactNode) {
  return <mark className="bg-transparent text-secondary-700 dark:text-secondary-300">{chunks}</mark>
}

/**
 * The header every landing section opens with: brand mark + section name, the
 * h2 with one highlighted phrase, and an optional one-color description. No
 * bars, rules or gradients.
 *
 * All three fade in with `FadeInView`, the animation every other text on the
 * page uses, top to bottom in 0.1s steps like the hero.
 */
function SectionHeader({
  eyebrow,
  title,
  description,
  headingId,
  align = "start",
  tone = "default",
  className,
}: SectionHeaderProps) {
  const inverse = tone === "inverse"
  return (
    <div
      className={cn(
        "flex flex-col gap-3.5",
        align === "center" ? "items-center text-center" : "items-start text-start",
        inverse && "dark",
        className
      )}
    >
      <FadeInView
        as="p"
        delay={0}
        className={cn(
          "m-0! flex items-center gap-2.5 text-[0.9375rem] leading-normal! font-semibold",
          inverse ? "text-secondary-300" : "text-secondary-700 dark:text-secondary-300"
        )}
      >
        <BrandMark inverse={inverse} />
        {eyebrow}
      </FadeInView>
      <FadeInView
        as="h2"
        id={headingId}
        delay={0.1}
        className={cn(
          "m-0! font-display text-3xl leading-[1.25] font-extrabold tracking-normal rtl:leading-[1.5] lg:text-[2.75rem]",
          inverse ? "text-white" : "text-ink"
        )}
      >
        {title}
      </FadeInView>
      {description && (
        <FadeInView
          as="p"
          delay={0.2}
          className={cn(
            "m-0! max-w-[38.75rem] text-lg leading-relaxed!",
            inverse ? "text-white/72" : "text-text-secondary"
          )}
        >
          {description}
        </FadeInView>
      )}
    </div>
  )
}

export { SectionHeader, sectionHighlight, type SectionHeaderProps }
