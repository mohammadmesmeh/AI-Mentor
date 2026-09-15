"use client"

import { useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import { AnimatePresence, motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import {
  goToStep,
  setOnboardingData,
  setSubmitStatus,
  setSubmitError,
  completeOnboarding,
  type OnboardingData,
  type SubmitStatus,
} from "@/redux/slices/onboardingSlice"
import type { RootState } from "@/redux/store"
import { onboardingService } from "../../services/onboardingService"
import { OnboardingLayout } from "../OnboardingLayout"
import { StepOneDomain } from "../StepOneDomain"
import { StepTwoSkillLevel } from "../StepTwoSkillLevel"
import { StepThreeTimeCommitment } from "../StepThreeTimeCommitment"
import { StepFourSuccessGoal } from "../StepFourSuccessGoal"
import { StepSixLearningPreferences } from "../StepSixLearningPreferences"
import { StepSevenReview } from "../StepSevenReview"

function OnboardingPage() {
  const dispatch = useDispatch()
  const locale = useLocale()
  const onboarding = useSelector((state: RootState) => state.onboarding)
  const { currentStep, submitStatus, isComplete } = onboarding
  const stepRegionRef = useRef<HTMLDivElement>(null)

  const showSuccess = submitStatus === "succeeded" || isComplete

  useEffect(() => {
    const id = window.setTimeout(() => {
      stepRegionRef.current?.querySelector("h1")?.focus()
    }, 320)
    return () => window.clearTimeout(id)
  }, [currentStep, showSuccess])

  const handleNext = () => {
    if (currentStep < 6) {
      dispatch(goToStep(currentStep + 1))
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch(goToStep(currentStep - 1))
    }
  }

  const handleUpdate = (field: string, value: unknown) => {
    dispatch(setOnboardingData({ [field]: value } as never))
  }

  const handleEdit = (step: number) => {
    dispatch(goToStep(step))
  }

  const handleSubmit = async () => {
    if (submitStatus === "submitting") {
      return
    }
    dispatch(setSubmitStatus("submitting"))
    const answers: OnboardingData = {
      domain: onboarding.domain,
      level: onboarding.level,
      timeCommitment: onboarding.timeCommitment,
      timeCustomDescription: onboarding.timeCustomDescription,
      successGoal: onboarding.successGoal,
      learningPreferences: onboarding.learningPreferences,
    }
    try {
      const result = await onboardingService.submitOnboarding(answers)
      if (result.status === "not-connected") {
        dispatch(setSubmitStatus("failed"))
        dispatch(setSubmitError("stepSixErrorNotConnected"))
        return
      }
      dispatch(setSubmitStatus("succeeded"))
      dispatch(completeOnboarding())
    } catch {
      dispatch(setSubmitStatus("failed"))
      dispatch(setSubmitError("stepSixErrorNotConnected"))
    }
  }

  const reviewStep = (status: SubmitStatus) => (
    <StepSevenReview
      domain={onboarding.domain}
      level={onboarding.level}
      timeCommitment={onboarding.timeCommitment}
      timeCustomDescription={onboarding.timeCustomDescription}
      successGoal={onboarding.successGoal}
      preferences={onboarding.learningPreferences}
      status={status}
      error={onboarding.submitError}
      onEdit={handleEdit}
      onSubmit={handleSubmit}
      onRetry={handleSubmit}
      onBack={handleBack}
    />
  )

  const steps: Record<number, React.ReactNode> = {
    1: (
      <StepOneDomain
        value={onboarding.domain}
        onChange={(v) => handleUpdate("domain", v)}
        onNext={handleNext}
      />
    ),
    2: (
      <StepTwoSkillLevel
        value={onboarding.level}
        onChange={(v) => handleUpdate("level", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    3: (
      <StepThreeTimeCommitment
        value={onboarding.timeCommitment}
        customDescription={onboarding.timeCustomDescription}
        onChange={(v) => handleUpdate("timeCommitment", v)}
        onCustomChange={(v) => handleUpdate("timeCustomDescription", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    4: (
      <StepFourSuccessGoal
        value={onboarding.successGoal}
        onChange={(v) => handleUpdate("successGoal", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    5: (
      <StepSixLearningPreferences
        preferences={onboarding.learningPreferences}
        onChangePreferences={(v) => handleUpdate("learningPreferences", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    6: reviewStep(onboarding.submitStatus),
  }

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={6}>
      <AnimatePresence mode="wait">
        <motion.div
          ref={stepRegionRef}
          key={showSuccess ? "success" : currentStep}
          initial={{ opacity: 0, x: locale === "ar" ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: locale === "ar" ? 24 : -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {showSuccess ? reviewStep("succeeded") : steps[currentStep]}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  )
}

export { OnboardingPage }