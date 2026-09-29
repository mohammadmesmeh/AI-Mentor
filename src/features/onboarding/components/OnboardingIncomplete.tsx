"use client"

import { ClipboardList } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import type { MissingField } from "@/lib/api/types"
import { LinkButton, PageState, Panel } from "@/features/dashboard/components/ui/workspace"

interface OnboardingIncompleteProps {
  missingFields: MissingField[]
}

const missingFieldKeyMap: Record<MissingField, string> = {
  goal: "missingGoal",
  self_assessed_level: "missingLevel",
  desired_outcome: "missingDesiredOutcome",
  available_minutes_per_week: "missingMinutes",
  preferred_learning_methods: "missingMethods",
  preferred_resource_sources: "missingResourceSources",
  resource_language: "missingResourceLanguage",
}

/** Lists exactly the fields GET /me/onboarding-status reports missing (§13). */
function OnboardingIncomplete({ missingFields }: OnboardingIncompleteProps) {
  const t = useT("onboarding")

  return (
    <div className="space-y-2">
      <PageState
        icon={ClipboardList}
        title={t("onboardingIncompleteTitle")}
        description={t("onboardingIncompleteDescription")}
        action={<LinkButton href="/onboarding">{t("backToOnboarding")}</LinkButton>}
      />
      {missingFields.length > 0 && (
        <Panel className="mx-auto max-w-md p-5">
          <p className="text-sm font-medium text-foreground">{t("missingFieldsLabel", "Missing information:")}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            {missingFields.map((field) => (
              <li key={field}>{t(missingFieldKeyMap[field] ?? field)}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}

export { OnboardingIncomplete, type OnboardingIncompleteProps }
