"use client"

import { useRouter } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"

const SCROLL_OFFSET = 88

const scrollToSection = (selector: string) => {
  const target = document.querySelector(selector)
  if (!target) {
    return
  }
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const y = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
  window.scrollTo({ top: Math.max(y, 0), behavior: reduceMotion ? "auto" : "smooth" })
}

const ctaBase =
  "cursor-pointer rounded-full px-6 py-3 text-sm font-bold sm:text-base " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function Hero() {
  const t = useT("hero")
  const router = useRouter()

  return (
    <section
      className="dark-section relative mx-auto mt-6 max-w-(--container-content) overflow-hidden rounded-2xl px-6 pb-20 pt-36 sm:mt-8 sm:rounded-3xl sm:pb-24"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="dot-grid absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -top-32 left-1/2 h-[480px] w-[760px] -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="animate-float h-full w-full rounded-full bg-primary-500/15 blur-[120px]" />
        </div>
        <div
          className="absolute -bottom-24 end-[8%] h-[320px] w-[320px] rounded-full bg-accent-500/10 blur-[100px]"
          aria-hidden="true"
        />
      </div>

      <Container>
        <div className="mx-auto flex max-w-(--container-hero) flex-col items-center text-center">
          <HeadingReveal
            as="h1"
            id="hero-heading"
            className="justify-center text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]"
            delay={0.1}
          >
            {t(
              "title",
              "Your Dynamic AI Career Roadmap, Synthesized in Real Time"
            )}
          </HeadingReveal>

          <FadeInView
            as="p"
            className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg"
            delay={0.2}
          >
            {t(
              "description",
              "Tell AI Mentor what you want to master. It synthesizes your roadmap from your goals, level, and schedule — then guides you through every milestone, one task at a time."
            )}
          </FadeInView>

          <FadeInView
            as="div"
            className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4"
            delay={0.3}
          >
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className={cn(
                ctaBase,
                "bg-primary text-primary-foreground shadow-md hover:bg-primary-700"
              )}
            >
              {t("ctaPrimary", "Generate Free Roadmap")}
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("#how-it-works")}
              className={cn(
                ctaBase,
                "bg-light-blue-bg text-light-blue-text hover:bg-light-blue-bg/90"
              )}
            >
              {t("ctaSecondary", "Explore Curriculums")}
            </button>
          </FadeInView>
        </div>
      </Container>
    </section>
  )
}