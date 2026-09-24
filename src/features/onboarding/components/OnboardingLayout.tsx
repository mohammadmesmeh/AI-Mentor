"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Check } from "lucide-react"
import { ProgressIndicator } from "./components/ProgressIndicator"

function BrandPanel() {
  const t = useTranslations("onboarding")

  const benefits = [
    {
      title: t("brandBenefit1Title"),
      description: t("brandBenefit1Description"),
    },
    {
      title: t("brandBenefit2Title"),
      description: t("brandBenefit2Description"),
    },
    {
      title: t("brandBenefit3Title"),
      description: t("brandBenefit3Description"),
    },
  ]

  return (
    <aside className="relative flex w-full flex-col justify-between border-b border-border-default bg-gradient-to-b from-surface-card to-primary/[0.04] p-8 md:w-[42%] md:shrink-0 md:border-b-0 md:border-r md:p-11">
      <div>
        <h2 className="mb-4 font-display text-2xl font-extrabold leading-[1.18] tracking-tight text-foreground uppercase sm:text-[26px] rtl:leading-[1.5]">
          {t("brandTitle")}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {t("brandDescription")}
        </p>
        <ul className="space-y-3.5 pt-2">
          {benefits.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              <p className="text-xs leading-snug text-muted-foreground">
                <strong className="font-semibold text-foreground">
                  {benefit.title}:
                </strong>{" "}
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps?: number
}

function OnboardingLayout({
  children,
  currentStep,
  totalSteps = 6,
}: OnboardingLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[1020px] px-4 py-10 sm:px-6">
      <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-border-default bg-surface-card shadow-floating transition-all duration-300 md:flex-row">
        <BrandPanel />
        <section className="flex w-full flex-col justify-between p-6 sm:p-8 md:flex-1 md:p-12">
          <div>
            <div className="mb-8">
              <ProgressIndicator
                currentStep={currentStep}
                totalSteps={totalSteps}
              />
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}

export { OnboardingLayout, type OnboardingLayoutProps }