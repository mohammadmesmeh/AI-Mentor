"use client"

import { useRouter } from "@/i18n/navigation"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/shared/components/ui/Button"
import { useT } from "@/shared/hooks/useT"
import type { MissingField } from "@/lib/api/types"

interface OnboardingIncompleteProps {
  missingFields: MissingField[]
}

const missingFieldKeyMap: Record<MissingField, string> = {
  goal: "missingGoal",
  self_assessed_level: "missingLevel",
  desired_outcome: "missingDesiredOutcome",
  available_minutes_per_week: "missingMinutes",
  preferred_learning_methods: "missingMethods",
  resource_language: "missingResourceLanguage",
}

function OnboardingIncomplete({ missingFields }: OnboardingIncompleteProps) {
  const t = useT("onboarding")
  const router = useRouter()

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-500/10">
          <AlertTriangle className="h-8 w-8 text-danger-500" aria-hidden="true" />
        </div>
      </div>

      <h1 className="mb-2 text-heading-md font-semibold text-foreground">
        {t("onboardingIncompleteTitle")}
      </h1>
      <p className="mb-6 text-muted-foreground">
        {t("onboardingIncompleteDescription")}
      </p>

      {missingFields.length > 0 && (
        <Card className="mb-6 border-danger-500/20 bg-danger-500/[0.04] text-start">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-medium text-foreground">{t("missingFieldsLabel", "Missing information:")}</p>
            <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
              {missingFields.map((field) => (
                <li key={field}>{t(missingFieldKeyMap[field] ?? field)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button variant="primary" onClick={() => router.push("/onboarding")}>
        {t("backToOnboarding")}
      </Button>
    </div>
  )
}

export { OnboardingIncomplete, type OnboardingIncompleteProps }