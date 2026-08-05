"use client"

import type { ReactNode } from "react"
import { ProgressIndicator } from "./components/ProgressIndicator"

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
}

function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
}: OnboardingLayoutProps) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="mb-10">
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
      </div>
      {children}
    </div>
  )
}

export { OnboardingLayout, type OnboardingLayoutProps }
