"use client"

import {
  BrainCircuit,
  Briefcase,
  Camera,
  ChartColumn,
  CodeXml,
  Globe,
  Megaphone,
  MessageCircle,
  Palette,
  PenLine,
  Shield,
  Smartphone,
  Target,
  Video,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { cn } from "@/lib/utils"

const DOMAINS: { key: string; icon: LucideIcon }[] = [
  { key: "webDevelopment", icon: CodeXml },
  { key: "uiUxDesign", icon: Palette },
  { key: "dataScience", icon: ChartColumn },
  { key: "digitalMarketing", icon: Megaphone },
  { key: "aiMachineLearning", icon: BrainCircuit },
  { key: "languages", icon: Globe },
  { key: "entrepreneurship", icon: Briefcase },
  { key: "cybersecurity", icon: Shield },
  { key: "photography", icon: Camera },
  { key: "mobileApps", icon: Smartphone },
  { key: "videoEditing", icon: Video },
  { key: "publicSpeaking", icon: MessageCircle },
  { key: "professionalWriting", icon: PenLine },
  { key: "leadership", icon: Target },
]

// Speeds are set on each row directly (a theme-token variable resolves at
// :root and made every row run at the same speed in an earlier iteration).
// The middle row is the visually primary one.
const ROWS = [
  { duration: "70s", reverse: false, primary: false },
  { duration: "85s", reverse: true, primary: true },
  { duration: "75s", reverse: false, primary: false },
] as const

// A row holds only 4–5 domains — narrower than the container — so each looping
// copy repeats the row's own items to stay wider than the visible area;
// otherwise a gap would show before the loop wraps.
const REPEATS_PER_COPY = 2

// Only the two existing brand tile treatments — soft blue and navy. Purple is
// reserved for the active milestone / current task (design.md), never here.
const TILE_TONES = [
  "bg-light-blue-bg text-light-blue-text",
  "bg-primary text-primary-foreground",
] as const

// Depth: outer rows are ~90% of the primary row's size. With reduced motion
// every row uses the primary size (no depth difference in the static layout).
const SIZES = {
  primary: {
    card: "gap-3 px-3.5 py-3 md:px-5 md:py-3.5",
    tile: "h-9 w-9 md:h-11 md:w-11",
    icon: "h-4.5 w-4.5 md:h-6 md:w-6",
    label: "text-sm md:text-base",
  },
  secondary: {
    card: "gap-2.5 px-3 py-2.5 md:gap-3 md:px-4 md:py-3 motion-reduce:gap-3 motion-reduce:px-3.5 motion-reduce:py-3 md:motion-reduce:px-5 md:motion-reduce:py-3.5",
    tile: "h-8 w-8 md:h-10 md:w-10 motion-reduce:h-9 motion-reduce:w-9 md:motion-reduce:h-11 md:motion-reduce:w-11",
    icon: "h-4 w-4 md:h-5 md:w-5 motion-reduce:h-4.5 motion-reduce:w-4.5 md:motion-reduce:h-6 md:motion-reduce:w-6",
    label: "text-xs md:text-sm motion-reduce:text-sm md:motion-reduce:text-base",
  },
} as const

// Soft fade at both inline edges so cards glide in/out instead of being cut.
// The -webkit- form is for Safari. Symmetric, so it needs no RTL variant.
const EDGE_FADE =
  "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] " +
  "[-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"

function MarqueeRow({
  items,
  duration,
  reverse,
  primary,
  label,
}: {
  items: { key: string; icon: LucideIcon; tone: string }[]
  duration: string
  reverse: boolean
  primary: boolean
  label: (key: string) => string
}) {
  const size = primary ? SIZES.primary : SIZES.secondary

  return (
    <div
      className={cn(
        // py leaves room for a hovered card's deeper shadow inside the clipped row.
        "overflow-hidden py-3",
        EDGE_FADE,
        !primary && "opacity-85 motion-reduce:opacity-100",
        "motion-reduce:overflow-visible motion-reduce:[mask-image:none] motion-reduce:[-webkit-mask-image:none]"
      )}
    >
      <div
        className={cn(
          "flex w-max animate-marquee",
          // Hovering anywhere over the rows pauses all of them (see `group`).
          "group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]",
          // Reduced motion: no animation at all (the global rule would otherwise
          // leave the strip parked at its end state) and a static wrapped layout.
          "motion-reduce:w-full motion-reduce:animate-none"
        )}
        style={{ animationDuration: duration }}
      >
        {[0, 1].map((copy) => (
          // pe matches the gap so both copies are exactly the same width and
          // the half-width shift loops without a seam.
          <ul
            key={copy}
            className={cn(
              "flex shrink-0 items-center gap-4 pe-4",
              "motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-3 motion-reduce:pe-0",
              copy === 1 && "motion-reduce:hidden"
            )}
          >
            {Array.from({ length: REPEATS_PER_COPY }, (_, repeat) =>
              items.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={`${repeat}-${item.key}`}
                    className={cn(
                      "flex shrink-0 items-center rounded-2xl border bg-card shadow-dropdown",
                      // Per-card hover: only a deeper shadow — no scaling.
                      "transition-[box-shadow] duration-200 ease-out hover:shadow-floating",
                      size.card,
                      repeat > 0 && "motion-reduce:hidden"
                    )}
                  >
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-xl",
                        size.tile,
                        item.tone
                      )}
                    >
                      <Icon className={size.icon} strokeWidth={2} />
                    </span>
                    <span
                      className={cn(
                        "whitespace-nowrap font-display font-bold text-primary",
                        size.label
                      )}
                    >
                      {label(item.key)}
                    </span>
                  </li>
                )
              })
            )}
          </ul>
        ))}
      </div>
    </div>
  )
}

/**
 * Marketing-only list of the kinds of things AI Mentor can build a roadmap
 * for. Static copy from messages — not tied to any API or roadmap data.
 * The moving rows are decorative (aria-hidden); the h2 is the accessible content.
 */
export function Domains() {
  const t = useTranslations("home.domains")
  const label = (key: string) => t(`items.${key}`)

  const rows = ROWS.map((row, r) => ({
    ...row,
    items: DOMAINS.filter((_, i) => i % ROWS.length === r).map((domain, i) => ({
      ...domain,
      tone: TILE_TONES[(r + i) % TILE_TONES.length],
    })),
  }))

  return (
    <section
      id="domains"
      className="relative overflow-hidden bg-background pt-20 pb-0 sm:pt-24"
      aria-labelledby="domains-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <HeadingReveal
            as="h2"
            id="domains-heading"
            className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl"
            delay={0.1}
          >
            {t("title")}
          </HeadingReveal>
        </div>

        <div className="group mt-10 space-y-1 sm:mt-14" aria-hidden="true">
          {rows.map((row, r) => (
            <MarqueeRow
              key={r}
              items={row.items}
              duration={row.duration}
              reverse={row.reverse}
              primary={row.primary}
              label={label}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
