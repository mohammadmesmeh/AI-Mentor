"use client"

import { useTranslations } from "next-intl"
import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"

/**
 * The final call to action: navy in both themes and centered — the one
 * intentional exception to the start-aligned section headers. Its button is
 * the most important one on the page, so it is the only white one.
 */
export function CTA() {
  const t = useTranslations("cta")

  return (
    <section
      className="dark-section relative overflow-hidden px-6 py-24"
      aria-labelledby="cta-heading"
    >
      {/* A soft brand-blue glow behind the content. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -bottom-40 left-1/2 h-80 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-secondary-500/15 blur-[100px]" />
      </div>

      <Container className="relative">
        <SectionHeader
          align="center"
          tone="inverse"
          headingId="cta-heading"
          eyebrow={t("badge")}
          title={t.rich("title", { mark: sectionHighlight })}
          description={t("description")}
        />

        <FadeInView as="div" className="mt-10 flex flex-col items-center gap-4" delay={0.15}>
          <Link
            href="/auth"
            className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-md bg-white px-8 text-base font-bold text-midnight no-underline shadow-lg transition-colors duration-200 hover:bg-secondary-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white focus-visible:ring-offset-3 focus-visible:ring-offset-midnight active:bg-secondary-200 sm:w-auto sm:px-10"
          >
            {t("button")}
            <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>

          <p className="m-0! text-sm text-white/60">{t("subtext")}</p>
        </FadeInView>
      </Container>
    </section>
  )
}
