"use client"

import { useT } from "@/shared/hooks/useT"

interface ReviewRow {
  label: string
  value: string
  step: number
}

interface CoreValues {
  domain: string
  level: string | null
  timeCommitment: string
  timeCustomDescription: string
  successGoal: string
}

const levelKeyMap: Record<string, string> = {
  beginner: "beginner",
  "some-experience": "someExperience",
  intermediate: "intermediate",
}

const timeKeyMap: Record<string, string> = {
  "15-30": "time15to30",
  "30-60": "time30to60",
  "1-2": "time1to2",
  weekends: "timeWeekends",
}

const preferenceKeyMap: Record<string, string> = {
  "hands-on": "handsOn",
  video: "video",
  reading: "reading",
  quizzes: "quizzes",
}

function buildCoreRows(t: (key: string) => string, values: CoreValues): ReviewRow[] {
  const timeValue =
    values.timeCommitment === "custom"
      ? values.timeCustomDescription.trim() || t("timeCustom")
      : values.timeCommitment
        ? t(timeKeyMap[values.timeCommitment] ?? "notSpecified")
        : t("notSpecified")

  return [
    { label: t("domain"), value: values.domain.trim() || t("notSpecified"), step: 1 },
    {
      label: t("level"),
      value: values.level ? t(levelKeyMap[values.level] ?? "notSpecified") : t("notSpecified"),
      step: 2,
    },
    { label: t("time"), value: timeValue, step: 3 },
    { label: t("goal"), value: values.successGoal.trim() || t("notSpecified"), step: 4 },
  ]
}

function buildPreferencesRow(t: (key: string) => string, preferences: string[]): ReviewRow {
  const value = preferences.length
    ? preferences.map((p) => t(preferenceKeyMap[p] ?? "notSpecified")).join(" · ")
    : t("notSpecified")
  return { label: t("style"), value, step: 5 }
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