"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import { useLocale } from "next-intl"
import { GraduationCap, UserRound } from "lucide-react"
import { useT } from "@/shared/hooks/useT"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
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
import { ErrorState, SignedOutState } from "@/features/dashboard/components/learning/shared"
import {
  LinkButton,
  LoadingRegion,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/features/dashboard/components/ui/workspace"
import { ChoiceGroup, Field } from "../controls"

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
    <div className="animate-fade-in space-y-8">
      <ProfileHeader />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <AccountPanel name={me.data.name} email={me.data.email} createdAt={me.data.createdAt} />
        <div className="lg:col-span-2">
          <LearningProfilePanel profile={profile.data} resourceLanguage={preferences.data?.resourceLanguage ?? null} />
        </div>
      </div>
    </div>
  )
}

function ProfileHeader() {
  const t = useT("account")
  return <PageHeader eyebrow={t("profileEyebrow")} title={t("profileTitle")} description={t("profileDescription")} />
}

/** GET /me — read-only: the contract has no endpoint to change name or email (§23). */
function AccountPanel({ name, email, createdAt }: { name: string; email: string; createdAt: string }) {
  const t = useT("account")
  const locale = useLocale()
  const since = createdAt ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(createdAt)) : null
  return (
    <Panel aria-labelledby="account-heading">
      <PanelHeader id="account-heading" icon={UserRound} title={t("accountSection")} />
      <dl className="space-y-4 p-5">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{t("name")}</dt>
          <dd dir="auto" className="font-medium text-foreground wrap-break-word">
            {name}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">{t("email")}</dt>
          <dd dir="ltr" className="text-start font-medium text-foreground break-all">
            {email}
          </dd>
        </div>
        {since && (
          <div>
            <dt className="text-xs font-medium text-muted-foreground">{t("memberSince")}</dt>
            <dd className="text-foreground">{since}</dd>
          </div>
        )}
        <p className="border-t border-border/50 pt-4 text-xs text-muted-foreground">{t("accountReadOnly")}</p>
      </dl>
    </Panel>
  )
}

type Draft = {
  goal: string
  selfAssessedLevel: SelfAssessedLevel | null
  desiredOutcome: string
  minutes: string
  methods: LearningMethod[]
}
type DraftErrors = Partial<Record<keyof Draft, string>>

function toDraft(profile: LearningProfile): Draft {
  return {
    goal: profile.goal ?? "",
    selfAssessedLevel: profile.selfAssessedLevel ?? null,
    desiredOutcome: profile.desiredOutcome ?? "",
    minutes: String(profile.availableMinutesPerWeek ?? ""),
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
  const minutes = Number(draft.minutes)
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 10080) errors.minutes = to("minutesInvalid")
  if (draft.methods.length === 0) errors.methods = t("methodsRequired")
  return errors
}

/** Server field names (§12) → form fields, for a 422 validation_failed. */
const SERVER_FIELDS: Record<string, keyof Draft> = {
  goal: "goal",
  self_assessed_level: "selfAssessedLevel",
  desired_outcome: "desiredOutcome",
  available_minutes_per_week: "minutes",
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
      <Panel aria-labelledby="learning-heading">
        <PanelHeader id="learning-heading" icon={GraduationCap} title={t("learningSection")} />
        <div className="space-y-4 p-5">
          <p className="text-muted-foreground">{t("noLearningProfile")}</p>
          <LinkButton href="/onboarding">{tw("continueOnboarding")}</LinkButton>
        </div>
      </Panel>
    )
  }

  return (
    <Panel aria-labelledby="learning-heading">
      <PanelHeader
        id="learning-heading"
        icon={GraduationCap}
        title={t("learningSection")}
        trailing={
          !editing && (
            <Button
              variant="secondary"
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
      />
      {editing ? (
        <LearningProfileForm
          profile={profile}
          onDone={(didSave) => {
            setEditing(false)
            setSaved(didSave)
          }}
        />
      ) : (
        <div className="space-y-4 p-5">
          {saved && (
            <p role="status" className="rounded-md bg-success-500/10 px-3 py-2 text-sm text-success-600 dark:text-success-500">
              {t("saved")}
            </p>
          )}
          <dl className="grid gap-4 sm:grid-cols-2">
            <ProfileRow label={t("goal")} value={profile.goal} wide />
            <ProfileRow
              label={t("level")}
              value={profile.selfAssessedLevel ? to(levelKeyMap[profile.selfAssessedLevel]) : null}
            />
            <ProfileRow
              label={t("minutes")}
              value={t("minutesValue", undefined, { count: profile.availableMinutesPerWeek })}
            />
            <ProfileRow label={t("outcome")} value={profile.desiredOutcome} wide />
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
            <div>
              <dt className="text-xs font-medium text-muted-foreground">{t("resourceLanguage")}</dt>
              <dd className="flex flex-wrap items-center gap-x-3 text-foreground">
                <span>{resourceLanguage ? to(resourceLanguageKeyMap[resourceLanguage]) : t("notSet")}</span>
                <TextLink href={WORKSPACE_ROUTES.settings}>{t("changeInSettings")}</TextLink>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Panel>
  )
}

function ProfileRow({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  const t = useT("account")
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd dir="auto" className="whitespace-pre-line text-foreground wrap-break-word">
        {value || <span className="text-muted-foreground">{t("notSet")}</span>}
      </dd>
    </div>
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
        availableMinutesPerWeek: Number(draft.minutes),
        preferredLearningMethods: draft.methods,
      }).unwrap()
      onDone(true)
    } catch (caught) {
      const error = asApiError(caught)
      if (error.category === "access_denied") {
        setFormError(t("sessionEnded"))
        return
      }
      // 422 validation_failed: mark the fields the server rejected. Its messages
      // are English-only (and never shown, FR-018), so ours are used.
      const serverErrors: DraftErrors = {}
      for (const field of Object.keys(error.details ?? {})) {
        const key = SERVER_FIELDS[field]
        if (key) serverErrors[key] = t("fieldInvalid")
      }
      setErrors(serverErrors)
      setFormError(t("saveFailed"))
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6 p-5">
      <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{t("roadmapUnchanged")}</p>

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
            className="input min-h-11 resize-y"
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
          <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-500">{errors.selfAssessedLevel}</p>
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
            className="input min-h-11 resize-y"
          />
        )}
      </Field>

      <Field id="lp-minutes" label={to("minutesPerWeek")} hint={to("minutesRangeHint")} error={errors.minutes}>
        {(describedBy) => (
          <input
            id="lp-minutes"
            type="number"
            inputMode="numeric"
            min={15}
            max={10080}
            value={draft.minutes}
            onChange={(e) => set("minutes", e.target.value)}
            aria-invalid={!!errors.minutes}
            aria-describedby={describedBy}
            className="input min-h-11 max-w-48"
          />
        )}
      </Field>

      <fieldset id="lp-methods" tabIndex={-1} className="space-y-3 outline-none" aria-describedby={errors.methods ? "lp-methods-error" : undefined}>
        <legend className="font-medium text-foreground">{t("methods")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {METHODS.map((method) => {
            const checked = draft.methods.includes(method)
            return (
              <label
                key={method}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  checked ? "border-primary bg-primary/5 dark:border-primary-300" : "border-border bg-card hover:bg-muted/60"
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
        {errors.methods && (
          <p id="lp-methods-error" className="text-xs text-danger-600 dark:text-danger-500">
            {errors.methods}
          </p>
        )}
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-600 dark:text-danger-500">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border/50 pt-5">
        <Button type="submit" variant="primary" size="lg" className="min-h-11" disabled={saving} aria-busy={saving || undefined}>
          {saving ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="secondary" size="lg" className="min-h-11" disabled={saving} onClick={() => onDone(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  )
}

function ProfileSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-80 rounded-lg lg:col-span-2" />
      </div>
    </LoadingRegion>
  )
}

export { ProfilePage }
