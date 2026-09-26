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

type CardSize = "sm" | "md" | "lg"

interface DomainCard {
  key: string
  icon: LucideIcon
  size: CardSize
  /**
   * md+ only: the collage's "noise" — a slight tilt and a vertical nudge so the
   * cards break out of neat rows and edge into each other's space. Below md the
   * cards sit in a plain 2-column grid with none of this.
   */
  scatter: string
}

// Order = reading order (DOM order) and flex order, so the scatter follows the
// page's inline direction and mirrors in RTL without any left/right values.
const CARDS: DomainCard[] = [
  { key: "webDevelopment", icon: CodeXml, size: "lg", scatter: "md:-rotate-3 md:translate-y-3" },
  { key: "uiUxDesign", icon: Palette, size: "md", scatter: "md:rotate-2 md:-translate-y-2" },
  { key: "dataScience", icon: ChartColumn, size: "sm", scatter: "md:rotate-[4deg] md:translate-y-5" },
  { key: "digitalMarketing", icon: Megaphone, size: "md", scatter: "md:-rotate-2 md:-translate-y-3" },
  { key: "aiMachineLearning", icon: BrainCircuit, size: "lg", scatter: "md:rotate-[1deg] md:translate-y-2" },
  { key: "languages", icon: Globe, size: "sm", scatter: "md:-rotate-[5deg] md:-translate-y-1" },
  { key: "entrepreneurship", icon: Briefcase, size: "md", scatter: "md:rotate-3 md:translate-y-4" },
  { key: "cybersecurity", icon: Shield, size: "sm", scatter: "md:-rotate-[4deg] md:-translate-y-4" },
  { key: "photography", icon: Camera, size: "lg", scatter: "md:rotate-2 md:translate-y-1" },
  { key: "mobileApps", icon: Smartphone, size: "md", scatter: "md:-rotate-1 md:-translate-y-3" },
  { key: "videoEditing", icon: Video, size: "sm", scatter: "md:rotate-[5deg] md:translate-y-3" },
  { key: "publicSpeaking", icon: MessageCircle, size: "lg", scatter: "md:-rotate-3 md:-translate-y-2" },
  { key: "professionalWriting", icon: PenLine, size: "md", scatter: "md:rotate-[4deg] md:translate-y-4" },
  { key: "leadership", icon: Target, size: "sm", scatter: "md:-rotate-2 md:-translate-y-1" },
]

const SIZE: Record<CardSize, { card: string; tile: string; icon: string; label: string }> = {
  sm: { card: "md:px-4 md:py-3", tile: "h-10 w-10", icon: "h-5 w-5", label: "md:text-sm" },
  md: { card: "md:px-5 md:py-3.5", tile: "h-10 w-10", icon: "h-5 w-5", label: "md:text-base" },
  lg: { card: "md:px-6 md:py-4", tile: "h-11 w-11", icon: "h-6 w-6", label: "md:text-lg" },
}

// Only the two existing brand tile treatments — soft blue and navy. Purple is
// reserved for the active milestone / current task (design.md), never here.
const TILE_TONES = [
  "bg-light-blue-bg text-light-blue-text",
  "bg-primary text-primary-foreground",
] as const

/**
 * Marketing-only collage of the kinds of things AI Mentor can build a roadmap
 * for. Static copy from messages — not tied to any API or roadmap data.
 */
export function Domains() {
  const t = useTranslations("home.domains")

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

        <ul
          className={cn(
            "mt-12 grid grid-cols-2 gap-3 sm:mt-16",
            "md:mx-auto md:flex md:max-w-4xl md:flex-wrap md:items-center md:justify-center md:gap-x-4 md:gap-y-6 md:py-4"
          )}
        >
          {CARDS.map(({ key, icon: Icon, size, scatter }, index) => {
            const s = SIZE[size]
            return (
              <li
                key={key}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-2xl border bg-card px-3 py-3 shadow-dropdown",
                  s.card,
                  scatter
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-xl",
                    s.tile,
                    TILE_TONES[index % TILE_TONES.length]
                  )}
                >
                  <Icon className={s.icon} strokeWidth={2} />
                </span>
                <span
                  className={cn(
                    "min-w-0 wrap-break-word font-display text-sm font-bold text-primary md:whitespace-nowrap",
                    s.label
                  )}
                >
                  {t(`items.${key}`)}
                </span>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
