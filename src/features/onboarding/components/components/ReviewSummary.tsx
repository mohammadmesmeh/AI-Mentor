"use client"

import { useT } from "@/shared/hooks/useT"
import type { Preferences } from "@/lib/api/types"
import type { LearningProfileField } from "@/lib/api/validation"
import {
  levelKeyMap,
  preferenceKeyMap,
  resourceLanguageKeyMap,
  uiLocaleKeyMap,
} from "../../lib/profileLabels"
import { formatWeekly } from "../../lib/timeCommitment"
import type { OnboardingFormState } from "@/redux/slices/onboardingSlice"

interface ReviewRow {
  /** Stable key (two rows can share a step). */
  id: string
  label: string
  value: string
  step: number
  /** The contract field this row shows, so a 422 on it can be flagged here. */
  field?: LearningProfileField
}

type CoreValues = Pick<
  OnboardingFormState,
  | "goal"
  | "selfAssessedLevel"
  | "availableMinutesPerWeek"
  | "desiredOutcome"
  | "preferredLearningMethods"
>

function buildCoreRows(
  t: (key: string, values?: Record<string, string | number>) => string,
  values: CoreValues
): ReviewRow[] {
  const minutes = values.availableMinutesPerWeek
  return [
    { id: "goal", field: "goal", label: t("goal"), value: values.goal.trim() || t("notSpecified"), step: 1 },
    {
      id: "level",
      field: "self_assessed_level",
      label: t("level"),
      value: values.selfAssessedLevel
        ? t(levelKeyMap[values.selfAssessedLevel] ?? "notSpecified")
        : t("notSpecified"),
      step: 2,
    },
    {
      id: "time",
      field: "available_minutes_per_week",
      label: t("time"),
      value: minutes && minutes > 0 ? formatWeekly(t, minutes) : t("notSpecified"),
      step: 3,
    },
    {
      id: "outcome",
      field: "desired_outcome",
      label: t("desiredOutcome"),
      value: values.desiredOutcome.trim() || t("notSpecified"),
      step: 4,
    },
    {
      id: "style",
      field: "preferred_learning_methods",
      label: t("style"),
      value: values.preferredLearningMethods.length
        ? values.preferredLearningMethods
            .map((m) => t(preferenceKeyMap[m] ?? "notSpecified"))
            .join(" · ")
        : t("notSpecified"),
      step: 5,
    },
  ]
}

function buildPreferencesRow(
  t: (key: string) => string,
  prefs: Pick<Preferences, "uiLocale" | "resourceLanguage" | "timezone">
): ReviewRow {
  return {
    id: "preferences",
    label: t("preferencesTitle"),
    value: [
      t(uiLocaleKeyMap[prefs.uiLocale] ?? "notSpecified"),
      t(resourceLanguageKeyMap[prefs.resourceLanguage] ?? "notSpecified"),
      prefs.timezone || t("notSpecified"),
    ].join(" · "),
    step: 6,
  }
}

interface ReviewSummaryProps {
  rows: ReviewRow[]
  onEdit?: (step: number) => void
  /** Fields the server rejected (422): their rows are flagged with what to fix. */
  invalidFields?: readonly LearningProfileField[]
}

function ReviewSummary({ rows, onEdit, invalidFields = [] }: ReviewSummaryProps) {
  const t = useT("onboarding")

  return (
    <dl className="divide-y rounded-lg border border-border bg-card">
      {rows.map((row) => {
        const invalid = row.field !== undefined && invalidFields.includes(row.field)
        const errorId = `review-${row.id}-error`
        return (
          <div
            key={row.id}
            className={
              "flex items-start justify-between gap-4 px-5 py-4" +
              (invalid ? " bg-danger-500/[0.06]" : "")
            }
          >
            <div className="min-w-0 flex-1">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd dir="auto" className="mt-0.5 text-foreground wrap-break-word">
                {row.value}
              </dd>
              {invalid && row.field && (
                <dd id={errorId} className="mt-1 text-sm text-danger-600 dark:text-danger-500">
                  {t(`fieldError.${row.field}`)}
                </dd>
              )}
            </div>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row.step)}
                aria-describedby={invalid ? errorId : undefined}
                className="font-ui inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
                aria-label={`${t("edit", "Edit")}: ${row.label}`}
              >
                {t("edit", "Edit")}
              </button>
            )}
          </div>
        )
      })}
    </dl>
  )
}

export { ReviewSummary, buildCoreRows, buildPreferencesRow, type ReviewRow }