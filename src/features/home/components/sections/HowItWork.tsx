"use client"

import { Activity, FlaskConical, Layers, RefreshCw } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { StepCard } from "@/shared/components/ui/StepCard"
import { SectionWave } from "@/shared/components/ui/SectionWave"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"

export const HowItWork = () => {
  const t = useT("howItWork")

  const steps = [
    {
      number: "01",
      icon: Activity,
      title: t("step1.title", "Diagnostic Profile Sync"),
      description: t(
        "step1.description",
        "Your mentor maps your goals, current level, and available time into a clear learning profile — the foundation for every decision that follows."
      ),
      span: "sm:row-span-2 lg:col-span-2 lg:row-span-2",
      cardClass: "sm:p-8",
    },
    {
      number: "02",
      icon: Layers,
      title: t("step2.title", "Real-time Curriculum Synthesis"),
      description: t(
        "step2.description",
        "A four-phase curriculum is assembled and re-sequenced in real time, so the path you see always matches where you actually are."
      ),
    },
    {
      number: "03",
      icon: FlaskConical,
      title: t("step3.title", "Sandbox Proof & Calibration"),
      description: t(
        "step3.description",
        "Each milestone is proven through hands-on sandbox practice, then calibrated to close the gaps that matter most."
      ),
    },
    {
      number: "04",
      icon: RefreshCw,
      title: t("step4.title", "Dynamic Milestone Refactoring"),
      description: t(
        "step4.description",
        "Milestones refactor dynamically as you grow — your roadmap stays ambitious, but every next step remains achievable."
      ),
      span: "sm:col-span-2 lg:col-span-2",
    },
  ]

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-background pt-10 pb-0 sm:pt-14 lg:pt-16"
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <FadeInView as="div" delay={0.05}>
            <span className="inline-flex items-center rounded-full bg-light-blue-bg px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-light-blue-text">
              {t("badge", "Precision Learning Pipeline")}
            </span>
          </FadeInView>

          <HeadingReveal
            as="h2"
            id="how-it-works-heading"
            className="mt-6 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl"
            delay={0.1}
          >
            {t("title", "Bento Learning Architecture")}
          </HeadingReveal>

          <FadeInView
            as="p"
            className="mt-4 text-muted-foreground"
            delay={0.15}
          >
            {t(
              "subtitle",
              "A four-phase curriculum engine that rebuilds your path as you learn — so every milestone stays sharp and achievable."
            )}
          </FadeInView>
        </div>

        <ul
          role="list"
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <li key={step.number} className="contents">
              <FadeInView
                className={cn("h-full", step.span)}
                delay={0.2 + index * 0.08}
              >
                <StepCard
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  className={cn("h-full", step.cardClass)}
                />
              </FadeInView>
            </li>
          ))}
        </ul>
      </Container>

      <SectionWave fillClassName="text-alt-bg" flipX className="mt-16 sm:mt-20" />
    </section>
  )
}