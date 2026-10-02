"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import { useLocale } from "next-intl"
import { Check, CircleAlert, Info } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/shared/components/ui/Avatar"
import { Button } from "@/shared/components/ui/Button"
import type { RootState } from "@/redux/store"
import {
  useGetLearningProfileQuery,
  useGetMeQuery,
  useGetPreferencesQuery,
  usePutLearningProfileMutation,
} from "@/lib/api/apiSlice"
import { asApiError } from "@/lib/api/errors"
import type { LearningMethod, LearningProfile, SelfAssessedLevel } from "@/lib/api/types"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import {
  LEVELS,
  METHODS,
  levelDescriptionKeyMap,
  levelKeyMap,
  preferenceKeyMap,
  resourceLanguageKeyMap,
} from "@/features/onboarding/lib/profileLabels"
import {
  TIME_PRESETS,
  choiceFromMinutes,
  choiceToMinutes,
  formatDuration,
  formatWeekly,
  timeErrorKeyMap,
  validateChoice,
  type TimeChoice,
} from "@/features/onboarding/lib/timeCommitment"
import { CustomTimeFields } from "@/features/onboarding/components/components/CustomTimeFields"
import { LEARNING_PROFILE_FIELDS, rejectedFields, type LearningProfileField } from "@/lib/api/validation"
import { ErrorState, SignedOutState } from "@/features/dashboard/components/learning/shared"
import {
  CardSkeleton,
  LinkButton,
  LoadingRegion,
  PageHeader,
  Skeleton,
  WorkspaceCard,
} from "@/features/dashboard/components/ui/workspace"
import { ChoiceGroup, Field, FieldError, inputClass } from "../controls"

function ProfilePage() {
  const restoring = useSelector((state: RootState) => state.auth.restoring)
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const skip = authenticated ? undefined : skipToken
  const me = useGetMeQuery(skip)
  const profile = useGetLearningProfileQuery(skip)
  const preferences = useGetPreferencesQuery(skip)

  if (restoring) return <ProfileSkeleton />
  if (!authenticated) return <SignedOutState />
  if (me.isError || profile.isError) {
    return (
      <ErrorState
        onRetry={() => {
          if (me.isError) void me.refetch()
          if (profile.isError) void profile.refetch()
        }}
      />
    )
  }
  if (!me.data || profile.data === undefined) return <ProfileSkeleton />

  return (
    <div className="animate-fade-in space-y-6">
      <ProfileHeader />
      <AccountPanel name={me.data.name} email={me.data.email} createdAt={me.data.createdAt} />
      <LearningProfilePanel profile={profile.data} resourceLanguage={preferences.data?.resourceLanguage ?? null} />
    </div>
  )
}

function ProfileHeader() {
  const t = useT("account")
  return <PageHeader title={t("profileTitle")} description={t("profileDescription")} />
}

/** GET /me — read-only: the contract has no endpoint to change name or email (§23). */
function AccountPanel({ name, email, createdAt }: { name: string; email: string; createdAt: string }) {
  const t = useT("account")
  const locale = useLocale()
  const since = createdAt ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(createdAt)) : null
  return (
    <Card
      as="section"
      variant="glass"
      aria-label={t("accountSection")}
      className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-7"
    >
      <Avatar name={name} tone="navy" className="size-16 font-display text-[1.75rem] font-extrabold sm:size-19 sm:text-[2rem]" />
      <div className="min-w-0 flex-1 space-y-0.5">
        {/* <bdi> keeps the text's own direction without moving it off the page's side. */}
        <p className="m-0 font-display text-[1.625rem] leading-snug font-extrabold wrap-break-word text-ink">
          <bdi>{name}</bdi>
        </p>
        <p className="m-0 text-sm break-all text-muted-foreground">
          <bdi dir="ltr">{email}</bdi>
        </p>
        {since && (
          <p className="m-0 text-[0.8125rem] font-semibold text-status-available">
            {t("memberSinceValue", undefined, { date: since })}
          </p>
        )}
        <p className="m-0 pt-1 text-xs text-muted-foreground">{t("accountReadOnly")}</p>
      </div>
    </Card>
  )
}

type Draft = {
  goal: string
  selfAssessedLevel: SelfAssessedLevel | null
  desiredOutcome: string
  /** A preset or "Other"; sent as whole minutes (contract §12). */
  time: TimeChoice | null
  methods: LearningMethod[]
}
type DraftErrors = Partial<Record<keyof Draft, string>>

function toDraft(profile: LearningProfile): Draft {
  return {
    goal: profile.goal ?? "",
    selfAssessedLevel: profile.selfAssessedLevel ?? null,
    desiredOutcome: profile.desiredOutcome ?? "",
    time: choiceFromMinutes(profile.availableMinutesPerWeek),
    methods: profile.preferredLearningMethods ?? [],
  }
}

/** Mirrors the contract's validation (§12) so most mistakes are caught before the request. */
function validate(draft: Draft, t: (key: string) => string, to: (key: string) => string): DraftErrors {
  const errors: DraftErrors = {}
  const goal = draft.goal.trim()
  if (!goal) errors.goal = t("goalRequired")
  else if (goal.length > 1000) errors.goal = t("goalTooLong")
  if (!draft.selfAssessedLevel) errors.selfAssessedLevel = t("levelRequired")
  const outcome = draft.desiredOutcome.trim()
  if (!outcome) errors.desiredOutcome = t("outcomeRequired")
  else if (outcome.length > 2000) errors.desiredOutcome = t("outcomeTooLong")
  const timeProblem = validateChoice(draft.time)
  if (timeProblem) errors.time = to(timeErrorKeyMap[timeProblem])
  if (draft.methods.length === 0) errors.methods = t("methodsRequired")
  return errors
}

/** Server field names (§12) → form fields, for a 422 validation_failed. */
const SERVER_FIELDS: Record<LearningProfileField, keyof Draft> = {
  goal: "goal",
  self_assessed_level: "selfAssessedLevel",
  desired_outcome: "desiredOutcome",
  available_minutes_per_week: "time",
  preferred_learning_methods: "methods",
}

/**
 * GET/PUT /me/learning-profile (§12). PUT replaces the whole profile, so every
 * field is sent. It never touches the roadmap (no generation is requested).
 */
function LearningProfilePanel({
  profile,
  resourceLanguage,
}: {
  profile: LearningProfile | null
  resourceLanguage: keyof typeof resourceLanguageKeyMap | null
}) {
  const t = useT("account")
  const to = useT("onboarding")
  const tw = useT("workspace")
  const locale = useLocale()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!profile) {
    return (
      <WorkspaceCard titleId="learning-heading" title={t("learningSection")}>
        <div className="space-y-4">
          <p className="m-0 text-muted-foreground">{t("noLearningProfile")}</p>
          <LinkButton href="/onboarding">{tw("continueOnboarding")}</LinkButton>
        </div>
      </WorkspaceCard>
    )
  }

  return (
    <WorkspaceCard
      titleId="learning-heading"
      title={t("learningSection")}
      action={
        !editing && (
          <Button
            variant="glass"
            className="min-h-11"
            onClick={() => {
              setSaved(false)
              setEditing(true)
            }}
          >
            {t("edit")}
          </Button>
        )
      }
    >
      {editing ? (
        <LearningProfileForm
          profile={profile}
          onDone={(didSave) => {
            setEditing(false)
            setSaved(didSave)
          }}
        />
      ) : (
        <div className="space-y-4">
          {saved && (
            <p role="status" className="m-0 flex items-center gap-2 text-sm font-semibold text-status-completed">
              <Check className="size-4" aria-hidden="true" />
              {t("saved")}
            </p>
          )}
          <dl className="m-0">
            <ProfileRow label={t("goal")} value={profile.goal} />
            <ProfileRow
              label={t("level")}
              value={profile.selfAssessedLevel ? to(levelKeyMap[profile.selfAssessedLevel]) : null}
            />
            <ProfileRow
              label={t("minutes")}
              value={formatWeekly((key, values) => to(key, undefined, values), profile.availableMinutesPerWeek)}
            />
            <ProfileRow label={t("outcome")} value={profile.desiredOutcome} />
            <ProfileRow
              label={t("methods")}
              value={
                profile.preferredLearningMethods?.length
                  ? new Intl.ListFormat(locale, { type: "conjunction" }).format(
                      profile.preferredLearningMethods.map((m) => to(preferenceKeyMap[m]))
                    )
                  : null
              }
            />
            <div className={PROFILE_ROW}>
              <dt className="text-muted-foreground">{t("resourceLanguage")}</dt>
              <dd className="m-0 flex flex-wrap items-center gap-x-3 font-semibold text-ink">

                <span>{resourceLanguage ? to(resourceLanguageKeyMap[resourceLanguage]) : t("notSet")}</span>
                <TextLink href={WORKSPACE_ROUTES.settings}>{t("changeInSettings")}</TextLink>
              </dd>
            </div>
          </dl>
          <RoadmapUnchangedNote />
        </div>
      )}
    </WorkspaceCard>
  )
}

const PROFILE_ROW = "grid gap-1 border-t border-line py-3.5 text-sm first:border-t-0 first:pt-0 sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:gap-4"

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  const t = useT("account")
  return (
    <div className={PROFILE_ROW}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 font-semibold whitespace-pre-line wrap-break-word text-ink">
        {value ? <bdi>{value}</bdi> : <span className="font-normal text-muted-foreground">{t("notSet")}</span>}
      </dd>
    </div>
  )
}

/** Editing the profile never touches the roadmap — said once, in soft blue. */
function RoadmapUnchangedNote() {
  const t = useT("account")
  return (
    <p className="m-0 flex items-start gap-2.5 rounded-icon bg-secondary-100/60 px-4 py-3.5 text-[0.8125rem] text-secondary-700 dark:bg-secondary-300/10 dark:text-secondary-300">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {t("roadmapUnchanged")}
    </p>
  )
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-secondary-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-secondary-300"
    >
      {children}
    </Link>
  )
}

function LearningProfileForm({ profile, onDone }: { profile: LearningProfile; onDone: (saved: boolean) => void }) {
  const t = useT("account")
  const to = useT("onboarding")
  const [putLearningProfile, { isLoading: saving }] = usePutLearningProfileMutation()
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile))
  const [errors, setErrors] = useState<DraftErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    setFormError(null)
    const found = validate(draft, t, to)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Move focus to the first invalid field.
      const first = Object.keys(found)[0]
      document.getElementById(`lp-${first}`)?.focus()
      return
    }
    try {
      await putLearningProfile({
        goal: draft.goal.trim(),
        selfAssessedLevel: draft.selfAssessedLevel as SelfAssessedLevel,
        desiredOutcome: draft.desiredOutcome.trim(),
        // Always whole minutes, whatever unit was picked.
        availableMinutesPerWeek: choiceToMinutes(draft.time) as number,
        // Sources are derived by the server from the methods (contract §12).
        preferredLearningMethods: draft.methods,
      }).unwrap()
      onDone(true)
    } catch (caught) {
      const error = asApiError(caught)
      if (error.category === "access_denied") {
        setFormError(t("sessionEnded"))
        return
      }
      // 422 validation_failed: mark each field the server rejected (array
      // errors arrive per item, e.g. "preferred_learning_methods.0") with what
      // the contract allows. The server's messages are English-only and never
      // shown (FR-018).
      const serverErrors: DraftErrors = {}
      for (const field of rejectedFields(error, LEARNING_PROFILE_FIELDS)) {
        serverErrors[SERVER_FIELDS[field]] = to(`fieldError.${field}`)
      }
      setErrors(serverErrors)
      setFormError(t("saveFailed"))
      const first = Object.keys(serverErrors)[0]
      if (first) document.getElementById(`lp-${first}`)?.focus()
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <RoadmapUnchangedNote />

      <Field id="lp-goal" label={t("goal")} error={errors.goal}>
        {(describedBy) => (
          <textarea
            id="lp-goal"
            dir="auto"
            rows={2}
            maxLength={1000}
            value={draft.goal}
            onChange={(e) => set("goal", e.target.value)}
            aria-invalid={!!errors.goal}
            aria-describedby={describedBy}
            className={cn(inputClass, "resize-y")}
          />
        )}
      </Field>

      <div id="lp-selfAssessedLevel" tabIndex={-1} className="outline-none">
        <ChoiceGroup
          name="lp-level"
          legend={t("level")}
          columns={3}
          options={LEVELS.map((level) => ({
            value: level,
            label: to(levelKeyMap[level]),
            description: to(levelDescriptionKeyMap[level]),
          }))}
          value={draft.selfAssessedLevel}
          onChange={(value) => set("selfAssessedLevel", value)}
        />
        {errors.selfAssessedLevel && (
          <div className="mt-1.5">
            <FieldError>{errors.selfAssessedLevel}</FieldError>
          </div>
        )}
      </div>

      <Field id="lp-desiredOutcome" label={t("outcome")} error={errors.desiredOutcome}>
        {(describedBy) => (
          <textarea
            id="lp-desiredOutcome"
            dir="auto"
            rows={3}
            maxLength={2000}
            value={draft.desiredOutcome}
            onChange={(e) => set("desiredOutcome", e.target.value)}
            aria-invalid={!!errors.desiredOutcome}
            aria-describedby={describedBy}
            className={cn(inputClass, "resize-y")}
          />
        )}
      </Field>

      <TimeField
        value={draft.time}
        onChange={(time) => set("time", time)}
        error={errors.time}
      />

      <fieldset id="lp-methods" tabIndex={-1} className="m-0 space-y-3 border-0 p-0 outline-none" aria-describedby={errors.methods ? "lp-methods-error" : undefined}>
        <legend className="p-0 text-sm font-semibold text-ink">{t("methods")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {METHODS.map((method) => {
            const checked = draft.methods.includes(method)
            return (
              <label
                key={method}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  checked ? "border-primary-900 bg-secondary-100/60 dark:border-status-completed dark:bg-secondary-300/10" : "border-line bg-glass-strong hover:bg-card"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    set("methods", checked ? draft.methods.filter((m) => m !== method) : [...draft.methods, method])
                  }
                  className="h-4 w-4 accent-primary"
                />
                {to(preferenceKeyMap[method])}
              </label>
            )
          })}
        </div>
        {errors.methods && <FieldError id="lp-methods-error">{errors.methods}</FieldError>}
      </fieldset>

      {formError && (
        <p role="alert" className="m-0 flex items-start gap-2 rounded-icon border border-primary-900/20 bg-glass-strong px-4 py-3 text-sm font-medium text-ink">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <Button type="submit" variant="primary" size="lg" className="min-h-11" disabled={saving} aria-busy={saving || undefined}>
          {saving ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="glass" size="lg" className="min-h-11" disabled={saving} onClick={() => onDone(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  )
}

const OTHER = "other"

/**
 * Weekly time: the onboarding's presets as radio cards, or "Other" with a
 * number and a unit. A stored value that isn't a preset opens as "Other".
 */
function TimeField({
  value,
  onChange,
  error,
}: {
  value: TimeChoice | null
  onChange: (value: TimeChoice) => void
  error?: string
}) {
  const t = useT("account")
  const to = useT("onboarding")
  const format = (key: string, values?: Record<string, string | number>) => to(key, undefined, values)
  const custom = value?.kind === "custom" ? value : null
  const selected = custom ? OTHER : value?.kind === "preset" ? String(value.minutes) : null
  const describedBy = [custom ? "lp-time-hint" : null, error ? "lp-time-error" : null].filter(Boolean).join(" ") || undefined

  return (
    <div id="lp-time" tabIndex={-1} className="space-y-3 outline-none">
      <ChoiceGroup
        name="lp-time"
        legend={t("minutes")}
        columns={3}
        options={[
          ...TIME_PRESETS.map((minutes) => ({ value: String(minutes), label: formatDuration(format, minutes) })),
          { value: OTHER, label: to("timeOther"), description: to("timeOtherDescription") },
        ]}
        value={selected}
        onChange={(next) => {
          if (next === OTHER) {
            if (!custom) onChange({ kind: "custom", amount: "", unit: "hours" })
          } else {
            onChange({ kind: "preset", minutes: Number(next) })
          }
        }}
      />
      {custom && (
        <div className="space-y-1.5">
          <CustomTimeFields
            id="lp-time-amount"
            amount={custom.amount}
            unit={custom.unit}
            onAmountChange={(amount) => onChange({ ...custom, amount })}
            onUnitChange={(unit) => onChange({ ...custom, unit })}
            invalid={!!error}
            describedBy={describedBy}
            inputClassName={inputClass}
          />
          <p id="lp-time-hint" className="m-0 text-xs text-muted-foreground">
            {to("customTimeHint")}
          </p>
        </div>
      )}
      {error && <FieldError id="lp-time-error">{error}</FieldError>}
    </div>
  )
}

function ProfileSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
        <CardSkeleton className="flex items-center gap-5 sm:p-7">
          <Skeleton className="size-16 rounded-full sm:size-19" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </CardSkeleton>
        <CardSkeleton className="h-96" />
      </div>
    </LoadingRegion>
  )
}

export { ProfilePage }
