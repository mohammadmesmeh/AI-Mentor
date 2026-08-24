"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLocale } from "next-intl"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "@/i18n/navigation"
import {
  goToStep,
  setOnboardingData,
  setIsGenerating,
  completeOnboarding,
  saveOnboardingData,
} from "@/redux/slices/onboardingSlice"
import type { OnboardingData } from "@/redux/slices/onboardingSlice"
import type { RootState } from "@/redux/store"
import { OnboardingLayout } from "../OnboardingLayout"
import { StepOneLearningGoal } from "../StepOneLearningGoal"
import { StepTwoSkillLevel } from "../StepTwoSkillLevel"
import { StepThreeLearningPreferences } from "../StepThreeLearningPreferences"
import { StepFourTimeCommitment } from "../StepFourTimeCommitment"
import { StepFiveSuccessGoal } from "../StepFiveSuccessGoal"
import { RoadmapGeneration } from "../RoadmapGeneration"

function OnboardingPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const locale = useLocale()
  const onboarding = useSelector((state: RootState) => state.onboarding)
  const { currentStep, isGenerating, isComplete } = onboarding

  useEffect(() => {
    if (isComplete) {
      router.push("/dashboard")
    }
  }, [isComplete, router])

  const handleNext = () => {
    if (currentStep < 5) {
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

  const handleGenerate = () => {
    dispatch(setIsGenerating(true))
    // TODO: Replace with Gemini roadmap generation API
    setTimeout(() => {
      const onboardingData: OnboardingData = {
        learningGoal: onboarding.learningGoal,
        skillLevel: onboarding.skillLevel ?? "",
        learningPreferences: onboarding.learningPreferences,
        timeCommitment: onboarding.timeCommitment,
        timeCustomDescription: onboarding.timeCustomDescription,
        successGoal: onboarding.successGoal,
      }
      dispatch(saveOnboardingData(onboardingData))
      dispatch(completeOnboarding())
    }, 3000)
  }

  if (isComplete) {
    return null
  }

  if (isGenerating) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <RoadmapGeneration />
      </div>
    )
  }

  const steps: Record<number, React.ReactNode> = {
    1: (
      <StepOneLearningGoal
        value={onboarding.learningGoal}
        onChange={(v) => handleUpdate("learningGoal", v)}
        onNext={handleNext}
      />
    ),
    2: (
      <StepTwoSkillLevel
        value={onboarding.skillLevel}
        onChange={(v) => handleUpdate("skillLevel", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    3: (
      <StepThreeLearningPreferences
        value={onboarding.learningPreferences}
        onChange={(v) => handleUpdate("learningPreferences", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    4: (
      <StepFourTimeCommitment
        value={onboarding.timeCommitment}
        customDescription={onboarding.timeCustomDescription}
        onChange={(v) => handleUpdate("timeCommitment", v)}
        onCustomChange={(v) => handleUpdate("timeCustomDescription", v)}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    5: (
      <StepFiveSuccessGoal
        value={onboarding.successGoal}
        onChange={(v) => handleUpdate("successGoal", v)}
        onGenerate={handleGenerate}
        onBack={handleBack}
        allData={onboarding}
      />
    ),
  }

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={5}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: locale === "ar" ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: locale === "ar" ? 24 : -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {steps[currentStep]}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  )
}

export { OnboardingPage }
