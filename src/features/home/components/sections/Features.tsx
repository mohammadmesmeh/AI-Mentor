"use client"

import { Target, Bot, TrendingUp, Lightbulb } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { useTranslations } from "next-intl"
import { FeatureCard } from "@/shared/components/ui/FeatureCard"

const features = [
  { icon: <Target className="h-6 w-6" />, key: "personalizedPlans" },
  { icon: <Bot className="h-6 w-6" />, key: "aiAnswers" },
  { icon: <TrendingUp className="h-6 w-6" />, key: "progressTracking" },
  { icon: <Lightbulb className="h-6 w-6" />, key: "smartFeedback" },
]

export function Features() {
  const t = useTranslations("features")

  return (
    <section className="py-14 md:py-24" aria-labelledby="features-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl"  id="features-heading">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subheading")}
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.key}
              icon={feature.icon}
              title={t(`${feature.key}.title`)}
              description={t(`${feature.key}.description`)}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
