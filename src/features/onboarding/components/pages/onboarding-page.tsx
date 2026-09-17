"use client"

import { useEffect, useRef } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import {
  goToStep,
  updateForm,
  updatePreferences,
  hydrate,
  setSubmitStatus,
  setSubmitError,
  type SubmitStatus,
} from "@/redux/slices/onboardingSlice"
import type { RootState } from "@/redux/store"
import {
  useGetOnboardingStatusQuery,
  useGetLearningProfileQuery,
  useGetPreferencesQuery,
  usePutLearningProfileMutation,
} from "@/lib/api/apiSlice"
import { toApiError } from "@/lib/api/errors"
import { OnboardingLayout } from "../OnboardingLayout"
import { StepOneDomain } from "../StepOneDomain"
import { StepTwoSkillLevel } from "../StepTwoSkillLevel"
import { StepThreeTimeCommitment } from "../StepThreeTimeCommitment"
import { StepFourSuccessGoal } from "../StepFourSuccessGoal"
import { StepSixLearningPreferences } from "../StepSixLearningPreferences"
import { PreferencesStep } from "../PreferencesStep"
import { StepSevenReview } from "../StepSevenReview"

const TOTAL_STEPS = 7

function OnboardingPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const locale = useLocale()
  const onboarding = useSelector((state: RootState) => state.onboarding)
  const { currentStep, form, preferences, submitStatus, submitError } = onboarding
  const stepRegionRef = useRef<HTMLDivElement>(null)

  const { data: preferencesQuery } = useGetPreferencesQuery()
  const { data: profileQuery, isLoading: profileLoading } = useGetLearningProfileQuery()
  const { data: onboardingQuery } = useGetOnboardingStatusQuery()
  const [putLearningProfile] = usePutLearningProfileMutation()

  useEffect(() => {
    if (profileQuery === undefined && preferencesQuery === undefined && onboardingQuery === undefined) {
      return
    }
    dispatch(
      hydrate({
        preferences: preferencesQuery ?? null,
        learningProfile: profileQuery ?? null,
        onboardingStatus: onboardingQuery ?? null,
      })
    )
  }, [dispatch, preferencesQuery, profileQuery, onboardingQuery])

  useEffect(() => {
    if (onboardingQuery?.completed && submitStatus !== "succeeded") {
      router.replace("/dashboard")
    }
  }, [onboardingQuery?.completed, submitStatus, router])

  useEffect(() => {
    const id = window.setTimeout(() => {
      stepRegionRef.current?.querySelector("h1")?.focus()
    }, 320)
    return () => window.clearTimeout(id)
  }, [currentStep, submitStatus])

  const showSuccess = submitStatus === "succeeded"

  useEffect(() => {
    if (!showSuccess) {
      return
    }
    const id = window.setTimeout(() => {
      router.replace("/dashboard")
    }, 1800)
    return () => window.clearTimeout(id)
  }, [showSuccess, router])

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      dispatch(goToStep(currentStep + 1))
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch(goToStep(currentStep - 1))
    }
  }

  const handleEdit = (step: number) => {
    dispatch(goToStep(step))
  }

  const handleSubmit = async () => {
    if (submitStatus === "submitting") {
      return
    }
    if (
      !form.selfAssessedLevel ||
      form.availableMinutesPerWeek === null ||
      form.availableMinutesPerWeek === undefined ||
      Number.isNaN(form.availableMinutesPerWeek) ||
      form.preferredLearningMethods.length === 0
    ) {
      dispatch(setSubmitStatus("failed"))
      dispatch(setSubmitError("stepSixSubmitFailed"))
      return
    }
    dispatch(setSubmitStatus("submitting"))
    try {
      await putLearningProfile({
        goal: form.goal.trim(),
        selfAssessedLevel: form.selfAssessedLevel,
        availableMinutesPerWeek: form.availableMinutesPerWeek,
        desiredOutcome: form.desiredOutcome.trim(),
        preferredLearningMethods: form.preferredLearningMethods,
      }).unwrap()
      dispatch(setSubmitStatus("succeeded"))
    } catch (error) {
      toApiError(error)
      dispatch(setSubmitStatus("failed"))
      dispatch(setSubmitError("stepSixSubmitFailed"))
    }
  }

  const reviewStep = (status: SubmitStatus) => (
    <StepSevenReview
      form={form}
      status={status}
      error={submitError}
      onEdit={handleEdit}
      onSubmit={handleSubmit}
      onRetry={handleSubmit}
      onBack={handleBack}
    />
  )

  const steps: Record<number, React.ReactNode> = {
    1: (
      <StepOneDomain
        value={form.goal}
        onChange={(v) => dispatch(updateForm({ goal: v }))}
        onNext={handleNext}
      />
    ),
    2: (
      <StepTwoSkillLevel
        value={form.selfAssessedLevel}
        onChange={(v) => dispatch(updateForm({ selfAssessedLevel: v }))}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    3: (
      <StepThreeTimeCommitment
        value={form.availableMinutesPerWeek}
        onChange={(v) => dispatch(updateForm({ availableMinutesPerWeek: v }))}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    4: (
      <StepFourSuccessGoal
        value={form.desiredOutcome}
        onChange={(v) => dispatch(updateForm({ desiredOutcome: v }))}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    5: (
      <StepSixLearningPreferences
        preferences={form.preferredLearningMethods}
        onChangePreferences={(v) => dispatch(updateForm({ preferredLearningMethods: v }))}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    6: (
      <PreferencesStep
        preferences={form.preferences}
        onChange={(patch) => dispatch(updatePreferences(patch))}
        onNext={handleNext}
        onBack={handleBack}
      />
    ),
    7: reviewStep(submitStatus),
  }

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={TOTAL_STEPS}>
      {profileLoading && preferences === null ? (
        <p className="py-8 text-center text-muted-foreground" aria-live="polite">
          Loading…
        </p>
      ) : (
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
      )}
    </OnboardingLayout>
  )
}

export { OnboardingPage }