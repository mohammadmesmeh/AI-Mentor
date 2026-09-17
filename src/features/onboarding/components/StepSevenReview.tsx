"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/shared/components/ui/Button"
import {
  ReviewSummary,
  buildCoreRows,
  buildPreferencesRow,
} from "./components/ReviewSummary"
import type {
  SubmitStatus,
  OnboardingFormState,
} from "@/redux/slices/onboardingSlice"

interface StepSevenReviewProps {
  form: OnboardingFormState
  status: SubmitStatus
  error: string | null
  onEdit: (step: number) => void
  onSubmit: () => void
  onRetry: () => void
  onBack: () => void
}

function StepSevenReview({
  form,
  status,
  error,
  onEdit,
  onSubmit,
  onRetry,
  onBack,
}: StepSevenReviewProps) {
  const t = useTranslations("onboarding")

  const rows = [
    ...buildCoreRows(t, form),
    buildPreferencesRow(t, form.preferences),
  ]

  if (status === "succeeded") {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" aria-hidden="true" />
            <h1
              className="font-display text-heading-md font-bold tracking-tight text-foreground outline-none"
              tabIndex={-1}
            >
              {t("stepSixSuccessTitle")}
            </h1>
            <p className="max-w-sm text-muted-foreground">
              {t("stepSixSuccessDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="font-display text-heading-md font-bold tracking-tight text-foreground outline-none"
          tabIndex={-1}
        >
          {t("stepFiveReviewTitle")}
        </h1>
        <p className="text-muted-foreground">{t("stepFiveReviewDescription")}</p>
      </div>

      <ReviewSummary rows={rows} onEdit={onEdit} />

      {status === "failed" && error && (
        <Card className="border-danger-500/20 bg-danger-500/[0.06]">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
              aria-hidden="true"
            />
            <p className="text-muted-foreground" aria-live="polite">
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {status === "submitting" ? (
        <div className="flex justify-end pt-8">
          <Button variant="primary" disabled>
            {t("stepSixSubmitting")}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-8">
          <div>
            <Button variant="secondary" onClick={onBack}>
              {t("back")}
            </Button>
          </div>
          {status === "failed" ? (
            <Button variant="secondary" onClick={onRetry}>
              {t("retry")}
            </Button>
          ) : (
            <Button variant="primary" onClick={onSubmit}>
              {t("submitOnboarding")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { StepSevenReview, type StepSevenReviewProps }