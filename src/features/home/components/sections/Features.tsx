"use client"

import { Target, Bot, TrendingUp, Lightbulb } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { TextReveal } from "@/shared/components/animations/TextReveal"
import { useT } from "@/shared/hooks/useT"
import { FeatureCard } from "@/shared/components/ui/FeatureCard"

const features = [
  { icon: <Target className="h-6 w-6" />, key: "personalizedPlans" },
  { icon: <Bot className="h-6 w-6" />, key: "aiAnswers" },
  { icon: <TrendingUp className="h-6 w-6" />, key: "progressTracking" },
  { icon: <Lightbulb className="h-6 w-6" />, key: "smartFeedback" },
]

export function Features() {
  const t = useT("features")

  return (
    <section className="py-14 md:py-24" aria-labelledby="features-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <TextReveal as="h2" id="features-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("heading", "Everything You Need to Learn Faster")}
          </TextReveal>
          <TextReveal as="p" className="mt-4 text-lg text-muted-foreground" delay={0.1}>
            {t("subheading", "AI Mentor combines personalized guidance, structured milestones, and on-demand support to help you learn smarter, not harder.")}
          </TextReveal>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.key}
              icon={feature.icon}
              title={t(`${feature.key}.title`, "Feature")}
              description={t(`${feature.key}.description`, "Feature description")}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
