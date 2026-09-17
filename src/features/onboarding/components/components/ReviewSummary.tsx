"use client"

import { useT } from "@/shared/hooks/useT"
import type {
  LearningMethod,
  Preferences,
  SelfAssessedLevel,
} from "@/lib/api/types"
import type { OnboardingFormState } from "@/redux/slices/onboardingSlice"

interface ReviewRow {
  label: string
  value: string
  step: number
}

type CoreValues = Pick<
  OnboardingFormState,
  | "goal"
  | "selfAssessedLevel"
  | "availableMinutesPerWeek"
  | "desiredOutcome"
  | "preferredLearningMethods"
>

const levelKeyMap: Record<SelfAssessedLevel, string> = {
  complete_beginner: "beginner",
  some_experience: "someExperience",
  intermediate: "intermediate",
}

const preferenceKeyMap: Record<LearningMethod, string> = {
  hands_on_projects: "handsOn",
  video_walkthroughs: "video",
  reading_docs: "reading",
  quizzes_drills: "quizzes",
}

const uiLocaleKeyMap: Record<Preferences["uiLocale"], string> = {
  ar: "prefArabic",
  en: "prefEnglish",
}

const resourceLanguageKeyMap: Record<Preferences["resourceLanguage"], string> = {
  ar: "prefArabic",
  en: "prefEnglish",
  both: "prefBoth",
}

function buildCoreRows(t: (key: string) => string, values: CoreValues): ReviewRow[] {
  const minutes = values.availableMinutesPerWeek
  return [
    { label: t("goal"), value: values.goal.trim() || t("notSpecified"), step: 1 },
    {
      label: t("level"),
      value: values.selfAssessedLevel
        ? t(levelKeyMap[values.selfAssessedLevel] ?? "notSpecified")
        : t("notSpecified"),
      step: 2,
    },
    {
      label: t("time"),
      value: minutes && minutes > 0 ? `${minutes} ${t("minutesPerWeek")}` : t("notSpecified"),
      step: 3,
    },
    {
      label: t("desiredOutcome"),
      value: values.desiredOutcome.trim() || t("notSpecified"),
      step: 4,
    },
    {
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
}

function ReviewSummary({ rows, onEdit }: ReviewSummaryProps) {
  const t = useT("onboarding")

  return (
    <dl className="divide-y rounded-xl border border-border bg-card">
      {rows.map((row) => (
        <div
          key={row.step}
          className="flex items-start justify-between gap-4 px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="mt-0.5 text-foreground">{row.value}</dd>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="font-ui shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus:outline-none"
              aria-label={t("edit", "Edit")}
            >
              {t("edit", "Edit")}
            </button>
          )}
        </div>
      ))}
    </dl>
  )
}

export { ReviewSummary, buildCoreRows, buildPreferencesRow, type ReviewRow }