"use client"

import { Check } from "lucide-react"
import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { SectionWave } from "@/shared/components/ui/SectionWave"
import { useT, type TranslateFn } from "@/shared/hooks/useT"
import { useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const freeCta =
  "w-full cursor-pointer rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/80 hover:shadow-lg active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

interface PricingPlan {
  key: "free" | "pro"
  featureKeys: string[]
  highlight: boolean
}

const plans: PricingPlan[] = [
  { key: "free", featureKeys: ["roadmap", "noCommunity", "mvp"], highlight: false },
  {
    key: "pro",
    featureKeys: [
      "community",
      "roadmaps",
      "mentor",
      "coffeeChats",
      "channels",
      "leaderboard",
      "cvAudio",
      "linkedinAudio",
      "multiModel",
    ],
    highlight: true,
  },
]

export function Pricing() {
  const t = useT("pricing")
  const router = useRouter()

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-background pt-20 pb-0 sm:pt-24"
      aria-labelledby="pricing-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <FadeInView as="div" delay={0.05}>
            <span className="inline-flex items-center rounded-full bg-light-blue-bg px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-light-blue-text">
              {t("badge", "Plans")}
            </span>
          </FadeInView>

          <HeadingReveal
            as="h2"
            id="pricing-heading"
            className="mt-6 font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl"
            delay={0.1}
          >
            {t("heading", "Simple Plans, Room To Grow")}
          </HeadingReveal>

          <FadeInView as="p" className="mt-4 text-lg text-muted-foreground" delay={0.15}>
            {t(
              "subheading",
              "Start free today. Pro and Premium are on the way with expanded, community-driven capabilities."
            )}
          </FadeInView>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 pb-20 sm:pb-24 lg:grid-cols-2 lg:items-stretch">
          {plans.map((plan, index) => (
            <FadeInView key={plan.key} className="h-full" delay={0.2 + index * 0.08}>
              <PlanCard
                t={t}
                planKey={plan.key}
                featureKeys={plan.featureKeys}
                highlight={plan.highlight}
                onFreeCta={() => router.push("/auth")}
              />
            </FadeInView>
          ))}
        </div>
      </Container>

      <SectionWave fillClassName="text-alt-bg" flipX className="mt-16 sm:mt-20" />
    </section>
  )
}

interface PlanCardProps {
  t: TranslateFn
  planKey: PricingPlan["key"]
  featureKeys: string[]
  highlight: boolean
  onFreeCta: () => void
}

function PlanCard({ t, planKey, featureKeys, highlight, onFreeCta }: PlanCardProps) {
  const isFree = planKey === "free"

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden p-6 sm:p-8",
        highlight
          ? "premium-card"
          : cn(
              "rounded-2xl border border-light-blue-bg/60 bg-light-blue-bg/40 backdrop-blur-md",
              "transition-all duration-300 hover:-translate-y-1 hover:bg-light-blue-bg/60 hover:shadow-xl",
              "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:bg-light-blue-bg/40 motion-reduce:hover:shadow-none"
            )
      )}
    >
    

      <h3 className="relative font-display text-xl font-bold text-primary">
        {t(`${planKey}.name`, planKey)}
      </h3>

      {/* `free.price` held the same word as `free.name` ("Free" / "مجاني"), so
          the card rendered the plan name twice, three lines apart. The name
          above already states the price; this row keeps only the qualifier. */}
      {isFree && (
        <p className="relative mt-1 text-sm text-muted-foreground">
          {t("free.priceSuffix", "current plan")}
        </p>
      )}

      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
        {t(`${planKey}.description`, "")}
      </p>

      {featureKeys.length > 0 && (
        <ul className="relative mt-6 flex flex-col gap-3">
          {featureKeys.map((featureKey) => (
            <li key={featureKey} className="flex items-start gap-2.5 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{t(`${planKey}.features.${featureKey}`, featureKey)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-auto pt-8">
        {isFree ? (
          <button type="button" onClick={onFreeCta} className={freeCta}>
            {t("free.cta", "Start Learning Free")}
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full cursor-not-allowed rounded-full border bg-muted px-6 py-3 text-sm font-bold text-muted-foreground opacity-70"
          >
            {t(`${planKey}.cta`, "Coming Soon")}
          </button>
        )}
      </div>
    </article>
  )
}
