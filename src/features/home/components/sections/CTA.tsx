"use client"

import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { useT } from "@/shared/hooks/useT"
import { useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const ctaBase =
  "cursor-pointer rounded-full px-8 py-4 text-sm font-bold sm:text-base " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

export function CTA() {
  const t = useT("cta")
  const router = useRouter()

  return (
    <section
      className="dark-section relative overflow-hidden px-6 py-24"
      aria-labelledby="cta-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary-500/15 blur-[120px]" />
        <div className="absolute -bottom-32 end-[10%] h-[320px] w-[320px] rounded-full bg-accent-500/10 blur-[100px]" />
      </div>

      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <HeadingReveal
            as="h2"
            id="cta-heading"
            className="justify-center text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
            delay={0.1}
          >
            {t(
              "title",
              "Ready to Synthesize Your AI Career Roadmap?"
            )}
          </HeadingReveal>

          <FadeInView
            as="p"
            className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
            delay={0.2}
          >
            {t(
              "description",
              "Stop guessing what to learn next. Get a personalized roadmap built by AI and start making real progress today."
            )}
          </FadeInView>

          <FadeInView
            as="div"
            className="mt-10 flex w-full flex-col items-center gap-4 sm:w-auto"
            delay={0.3}
          >
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className={cn(
                ctaBase,
                "w-full bg-primary text-primary-foreground shadow-md hover:bg-primary-700 sm:w-auto sm:px-10"
              )}
            >
              {t("button", "Start Learning Free")}
            </button>

            <p className="text-sm text-white/60">
              {t("subtext", "No credit card required")}
            </p>
          </FadeInView>
        </div>
      </Container>
    </section>
  )
}