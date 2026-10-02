"use client"

import { Activity, FlaskConical, Layers, RefreshCw } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { StepCard } from "@/shared/components/ui/StepCard"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"
import { SectionWave } from "@/shared/components/ui/SectionWave"
import { useTranslations } from "next-intl"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"

export const HowItWork = () => {
  const t = useT("howItWork")
  // Rich text: the title marks its key phrase with <mark> in the messages.
  const rich = useTranslations("howItWork")

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
      className="relative overflow-hidden bg-section-canvas pt-10 pb-0 sm:pt-14 lg:pt-16"
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <SectionHeader
          headingId="how-it-works-heading"
          eyebrow={t("badge")}
          title={rich.rich("title", { mark: sectionHighlight })}
          description={t("subtitle")}
        />

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
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

      <SectionWave fillClassName="text-section-alt" flipX className="mt-16 sm:mt-20" />
    </section>
  )
}