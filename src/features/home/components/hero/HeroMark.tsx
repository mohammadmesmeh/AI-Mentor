import { cn } from "@/lib/utils"

/**
 * The logo mark as the hero visual: the dot and the two chevrons, each with
 * its own blue gradient, under one soft shadow. The same geometry as the
 * reference, cropped to the mark (380 × 360 with room for the shadow).
 *
 * The chevrons point forward: mirrored in RTL. Decorative — the brand name is
 * in the navbar logo.
 */
function HeroMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 380 360"
      // The shadow spreads past the mark's box: let it, or its edge shows as a line.
      className={cn("h-auto overflow-visible rtl:-scale-x-100", className)}
    >
      <defs>
        <linearGradient id="hero-mark-dot" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-hero-mark-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-hero-mark-2)" }} />
        </linearGradient>
        <linearGradient id="hero-mark-chevron-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-hero-mark-3)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-hero-mark-4)" }} />
        </linearGradient>
        <linearGradient id="hero-mark-chevron-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-hero-mark-5)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-hero-mark-6)" }} />
        </linearGradient>
        <filter id="hero-mark-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" floodOpacity="0.22" style={{ floodColor: "var(--color-hero-mark-4)" }} />
        </filter>
      </defs>
      <g filter="url(#hero-mark-shadow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="58" cy="160" r="38" fill="url(#hero-mark-dot)" />
        <path d="M132 60l92 96-92 96" stroke="url(#hero-mark-chevron-1)" strokeWidth="72" />
        <path d="M250 72l82 84-82 84" stroke="url(#hero-mark-chevron-2)" strokeWidth="60" />
      </g>
    </svg>
  )
}

export { HeroMark }
