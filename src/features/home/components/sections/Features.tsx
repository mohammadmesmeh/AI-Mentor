"use client"

import { Target, Bot, TrendingUp, Lightbulb } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { useTranslations } from "next-intl"
import { useT } from "@/shared/hooks/useT"
import { FeatureCard } from "@/shared/components/ui/FeatureCard"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"
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
  // Rich text: the heading marks its key phrase with <mark> in the messages.
  const rich = useTranslations("features")

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-section-alt pt-20 pb-0 sm:pt-24"
      aria-labelledby="features-heading"
    >
      <Container>
        <SectionHeader
          headingId="features-heading"
          eyebrow={t("badge")}
          title={rich.rich("heading", { mark: sectionHighlight })}
          description={t("subheading")}
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      <SectionWave fillClassName="text-section-canvas" flipX className="mt-16 sm:mt-20" />
    </section>
  )
}