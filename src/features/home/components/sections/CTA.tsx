"use client"

import { useTranslations } from "next-intl"
import { Container } from "@/shared/components/ui/Container"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"
import { useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const ctaBase =
  "cursor-pointer rounded-full px-8 py-4 text-sm font-bold sm:text-base " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function CTA() {
  const t = useTranslations("cta")
  const router = useRouter()

  return (
    <section
      className="dark-section relative overflow-hidden px-6 py-24"
      aria-labelledby="cta-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -bottom-32 end-[10%] h-[320px] w-[320px] rounded-full bg-accent-500/10 blur-[100px]" />
      </div>

      <Container>
        {/* This section is navy in both themes: `dark` gives the header its
            on-dark colors here, whatever the app theme is. */}
        <div className="dark">
          <SectionHeader
            headingId="cta-heading"
            eyebrow={t("badge")}
            title={t.rich("title", { mark: sectionHighlight })}
            description={t("description")}
          />
        </div>

        <FadeInView
          as="div"
          className="mt-12 flex w-full flex-col items-start gap-4 sm:w-auto"
          delay={0.15}
        >
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className={cn(
              ctaBase,
              "w-full bg-primary text-primary-foreground shadow-md hover:bg-primary/80 sm:w-auto sm:px-10"
            )}
          >
            {t("button")}
          </button>

          <p className="text-sm text-white/60">{t("subtext")}</p>
        </FadeInView>
      </Container>
    </section>
  )
}
