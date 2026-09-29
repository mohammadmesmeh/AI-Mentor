"use client"

import { Target, Bot, TrendingUp, Lightbulb } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { useT } from "@/shared/hooks/useT"
import { FeatureCard } from "@/shared/components/ui/FeatureCard"
import { SectionWave } from "@/shared/components/ui/SectionWave"
import { cn } from "@/lib/utils"

const features = [
  {
    key: "personalizedPlans",
    icon: Target,
  },
  {
    key: "aiAnswers",
    icon: Bot,
  },
  {
    key: "progressTracking",
    icon: TrendingUp,
  },
  {
    key: "smartFeedback",
    icon: Lightbulb,
    span: "lg:col-span-3",
  },
]

export function Features() {
  const t = useT("features")

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-alt-bg pt-20 pb-0 sm:pt-24"
      aria-labelledby="features-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <FadeInView as="div" delay={0.05}>
            <span className="inline-flex items-center rounded-full bg-light-blue-bg px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-light-blue-text">
              {t("badge", "Core Capabilities")}
            </span>
          </FadeInView>

          <HeadingReveal
            as="h2"
            id="features-heading"
            className="mt-6 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl"
            delay={0.1}
          >
            {t("heading", "Everything You Need to Learn Faster")}
          </HeadingReveal>

          <FadeInView as="p" className="mt-4 text-lg text-muted-foreground" delay={0.15}>
            {t(
              "subheading",
              "Khatwa combines personalized guidance, structured milestones, and on-demand support to help you learn smarter, not harder."
            )}
          </FadeInView>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FadeInView
              key={feature.key}
              className={cn("h-full", feature.span)}
              delay={0.2 + index * 0.08}
            >
              <FeatureCard
                icon={feature.icon}
                title={t(`${feature.key}.title`, "Feature")}
                description={t(`${feature.key}.description`, "Feature description")}
                className="h-full"
              />
            </FadeInView>
          ))}
        </div>
      </Container>

      <SectionWave fillClassName="text-background" flipX className="mt-16 sm:mt-20" />
    </section>
  )
}