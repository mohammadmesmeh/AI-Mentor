"use client"

import { useEffect, useRef } from "react"
import { useLocale, useTranslations } from "next-intl"
import { skipToken } from "@reduxjs/toolkit/query"
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
  setSubmitFieldErrors,
  type SubmitStatus,
} from "@/redux/slices/onboardingSlice"
import type { AppDispatch, RootState } from "@/redux/store"
import {
  useGetOnboardingStatusQuery,
  useGetLearningProfileQuery,
  useGetPreferencesQuery,
  usePutLearningProfileMutation,
} from "@/lib/api/apiSlice"
import { asApiError } from "@/lib/api/errors"
import { LEARNING_PROFILE_FIELDS, rejectedFields } from "@/lib/api/validation"
import { LinkButton, LoadingRegion, Skeleton } from "@/features/dashboard/components/ui/workspace"
import { startRoadmapGeneration } from "@/features/dashboard/hooks/useGenerateRoadmap"
import { OnboardingLayout } from "../OnboardingLayout"
import { StepOneDomain } from "../StepOneDomain"
import { StepTwoSkillLevel } from "../StepTwoSkillLevel"
import { StepThreeTimeCommitment } from "../StepThreeTimeCommitment"
import { StepFourSuccessGoal } from "../StepFourSuccessGoal"
import { StepSixLearningPreferences } from "../StepSixLearningPreferences"
import { PreferencesStep } from "../PreferencesStep"
import { StepSevenReview } from "../StepSevenReview"
import { validateMinutes } from "../../lib/timeCommitment"

const TOTAL_STEPS = 7

function OnboardingPage() {
  // Tokens live only in memory (FR-007): without a session every call below
  // would go out unauthenticated and 401 — ask for sign-in instead.
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const restoring = useSelector((state: RootState) => state.auth.restoring)
  if (restoring) return <OnboardingRestoring />
  if (!authenticated) return <OnboardingSignedOut />
  return <OnboardingFlow />
}

function OnboardingRestoring() {
  return (
    <OnboardingLayout currentStep={1} totalSteps={TOTAL_STEPS}>
      <StepSkeleton />
    </OnboardingLayout>
  )
}

/** The shape of a step (title, text, field, navigation), so nothing shifts when it loads. */
function StepSkeleton() {
  const t = useTranslations("onboarding")
  return (
    <LoadingRegion label={t("loadingProfile")}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-14 rounded-md" />
      <div className="flex justify-between border-t border-border-default pt-8">
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-32" />
      </div>
    </LoadingRegion>
  )
}

function OnboardingSignedOut() {
  const t = useTranslations("dashboard")
  return (
    <OnboardingLayout currentStep={1} totalSteps={TOTAL_STEPS}>
      <div className="mx-auto max-w-md py-12 text-center">
        <h1 className="mb-2 text-heading-md font-semibold text-foreground">{t("signedOutTitle")}</h1>
        <p className="mb-6 text-muted-foreground">{t("signedOutDescription")}</p>
        <LinkButton href="/auth">{t("signInAgain")}</LinkButton>
      </div>
    </OnboardingLayout>
  )
}

function OnboardingFlow() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const locale = useLocale()
  const onboarding = useSelector((state: RootState) => state.onboarding)
  const { currentStep, form, preferences, submitStatus, submitError, submitFieldErrors } = onboarding
  const stepRegionRef = useRef<HTMLDivElement>(null)

  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const gate = authenticated ? undefined : skipToken
  const { data: preferencesQuery } = useGetPreferencesQuery(gate)
  const { data: profileQuery, isLoading: profileLoading } = useGetLearningProfileQuery(gate)
  const { data: onboardingQuery } = useGetOnboardingStatusQuery(gate)
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
      validateMinutes(form.availableMinutesPerWeek) !== null ||
      form.preferredLearningMethods.length === 0 ||
      form.preferredResourceSources.length === 0
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
        // Always whole minutes (contract §12), whatever unit was picked.
        availableMinutesPerWeek: form.availableMinutesPerWeek as number,
        desiredOutcome: form.desiredOutcome.trim(),
        preferredLearningMethods: form.preferredLearningMethods,
        preferredResourceSources: form.preferredResourceSources,
      }).unwrap()
      dispatch(setSubmitStatus("succeeded"))
      // Contract §22: generation starts as soon as onboarding completes — the
      // success screen promises it. The thunk keeps running after the redirect
      // and the dashboard polls the request. A learner has one roadmap, so
      // nothing is generated when one is already active.
      void dispatch(startRoadmapGeneration())
    } catch (error) {
      // unwrap() rejects with the normalized ApiError. A 401 whose refresh
      // failed is a session problem, never "couldn't save" (or a generation
      // failure): say so and offer sign-in.
      const apiError = asApiError(error)
      dispatch(setSubmitStatus("failed"))
      if (apiError.category === "access_denied") {
        dispatch(setSubmitError("submitSessionExpired"))
        return
      }
      // 422 validation_failed: flag the rejected answers on the review rows,
      // each with what the contract allows (ar/en), not only a generic error.
      const fields = rejectedFields(apiError, LEARNING_PROFILE_FIELDS)
      dispatch(setSubmitFieldErrors(fields))
      dispatch(setSubmitError(fields.length > 0 ? "reviewFieldsInvalid" : "stepSixSubmitFailed"))
    }
  }

  const reviewStep = (status: SubmitStatus) => (
    <StepSevenReview
      form={form}
      status={status}
      error={submitError}
      fieldErrors={submitFieldErrors}
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
        sources={form.preferredResourceSources}
        onChangeSources={(v) => dispatch(updateForm({ preferredResourceSources: v }))}
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
        <StepSkeleton />
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