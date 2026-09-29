"use client"

import { useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import { useLocale } from "next-intl"
import { BookOpen, Languages, LogOut, UserRound } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { useTheme } from "@/shared/components/providers/ThemeProvider"
import { useSwitchLocale } from "@/shared/hooks/useSwitchLocale"
import type { RootState } from "@/redux/store"
import { useGetPreferencesQuery, useLogoutMutation, useUpdatePreferencesMutation } from "@/lib/api/apiSlice"
import type { Preferences, ResourceLanguage, UiLocale } from "@/lib/api/types"
import { resourceLanguageKeyMap } from "@/features/onboarding/lib/profileLabels"
import { ErrorState, SignedOutState } from "@/features/dashboard/components/learning/shared"
import {
  LoadingRegion,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/features/dashboard/components/ui/workspace"
import { ChoiceGroup, SaveStatus, type SaveState } from "../controls"

/**
 * Only what the contract supports (§11): ui_locale, resource_language and
 * timezone via PATCH /me/preferences, plus the local theme and sign-out. There
 * is no endpoint to change the password, name or email, or to delete the
 * account (§23), so none is offered (docs/backend-issues.md). Nothing here can
 * request a roadmap generation.
 */
function SettingsPage() {
  const restoring = useSelector((state: RootState) => state.auth.restoring)
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const preferences = useGetPreferencesQuery(authenticated ? undefined : skipToken)

  if (restoring) return <SettingsSkeleton />
  if (!authenticated) return <SignedOutState />
  if (preferences.isError) return <ErrorState onRetry={() => void preferences.refetch()} />
  if (preferences.data === undefined) return <SettingsSkeleton />

  return <SettingsContent preferences={preferences.data} />
}

function useStatusLabels() {
  const t = useT("account")
  return { saving: t("savingShort"), saved: t("savedShort"), failed: t("saveFailedShort") }
}

function SettingsContent({ preferences }: { preferences: Preferences | null }) {
  const t = useT("account")
  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader eyebrow={t("settingsEyebrow")} title={t("settingsTitle")} description={t("settingsDescription")} />
      <AppearancePanel />
      <LearningPreferencesPanel preferences={preferences} />
      <AccountActionsPanel />
    </div>
  )
}

function AppearancePanel() {
  const t = useT("account")
  const locale = useLocale() as UiLocale
  const switchLocale = useSwitchLocale()
  const { theme, setTheme } = useTheme()
  const labels = useStatusLabels()
  const [localeSave, setLocaleSave] = useState<SaveState>("idle")

  return (
    <Panel aria-labelledby="appearance-heading">
      <PanelHeader id="appearance-heading" icon={Languages} title={t("appearanceSection")} />
      <div className="space-y-8 p-5">
        <ChoiceGroup<UiLocale>
          name="ui-locale"
          legend={t("interfaceLanguage")}
          hint={t("interfaceLanguageHint")}
          trailing={<SaveStatus state={localeSave} labels={labels} />}
          options={[
            { value: "ar", label: "العربية", lang: "ar" },
            { value: "en", label: "English", lang: "en" },
          ]}
          value={locale}
          onChange={(next) => {
            setLocaleSave("saving")
            // Route change + PATCH ui_locale; the store and cache survive.
            void switchLocale(next).then((ok) => setLocaleSave(ok ? "saved" : "failed"))
          }}
        />
        <ChoiceGroup<"light" | "dark">
          name="theme"
          legend={t("theme")}
          hint={t("themeHint")}
          options={[
            { value: "light", label: t("themeLight") },
            { value: "dark", label: t("themeDark") },
          ]}
          value={theme}
          onChange={setTheme}
        />
      </div>
    </Panel>
  )
}

function LearningPreferencesPanel({ preferences }: { preferences: Preferences | null }) {
  const t = useT("account")
  const to = useT("onboarding")
  const labels = useStatusLabels()
  const [updatePreferences] = useUpdatePreferencesMutation()
  const [resourceSave, setResourceSave] = useState<SaveState>("idle")
  const [timezoneSave, setTimezoneSave] = useState<SaveState>("idle")
  const deviceZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const zones = useMemo(() => {
    const all = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
    const current = preferences?.timezone
    // Keep the saved value selectable even if this browser doesn't list it (e.g. "UTC").
    return current && !all.includes(current) ? [current, ...all] : all
  }, [preferences?.timezone])

  if (!preferences) {
    return (
      <Panel aria-labelledby="learning-prefs-heading">
        <PanelHeader id="learning-prefs-heading" icon={BookOpen} title={t("learningPrefsSection")} />
        <p role="alert" className="p-5 text-muted-foreground">
          {t("preferencesUnavailable")}
        </p>
      </Panel>
    )
  }

  const save = (patch: { resourceLanguage?: ResourceLanguage; timezone?: string }, setState: (s: SaveState) => void) => {
    setState("saving")
    updatePreferences(patch)
      .unwrap()
      .then(() => setState("saved"))
      .catch(() => setState("failed"))
  }

  return (
    <Panel aria-labelledby="learning-prefs-heading">
      <PanelHeader id="learning-prefs-heading" icon={BookOpen} title={t("learningPrefsSection")} />
      <div className="space-y-8 p-5">
        <ChoiceGroup<ResourceLanguage>
          name="resource-language"
          legend={t("resourceLanguage")}
          hint={t("resourceLanguageHint")}
          columns={3}
          trailing={<SaveStatus state={resourceSave} labels={labels} />}
          disabled={resourceSave === "saving"}
          options={(["ar", "en", "both"] as const).map((value) => ({
            value,
            label: to(resourceLanguageKeyMap[value]),
          }))}
          value={preferences.resourceLanguage}
          onChange={(value) => save({ resourceLanguage: value }, setResourceSave)}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="timezone" className="font-medium text-foreground">
              {t("timezone")}
            </label>
            <SaveStatus state={timezoneSave} labels={labels} />
          </div>
          <p id="timezone-hint" className="-mt-2 text-sm text-muted-foreground">
            {t("timezoneHint")}
          </p>
          <select
            id="timezone"
            dir="ltr"
            aria-describedby="timezone-hint"
            value={preferences.timezone}
            disabled={timezoneSave === "saving"}
            onChange={(e) => save({ timezone: e.target.value }, setTimezoneSave)}
            className="input min-h-11 max-w-md"
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {deviceZone && deviceZone !== preferences.timezone && (
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={timezoneSave === "saving"}
              onClick={() => save({ timezone: deviceZone }, setTimezoneSave)}
            >
              {t("useDeviceTimezone", undefined, { zone: deviceZone.replace(/_/g, " ") })}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  )
}

function AccountActionsPanel() {
  const t = useT("account")
  const tn = useT("nav")
  const router = useRouter()
  const [logout] = useLogoutMutation()
  return (
    <Panel aria-labelledby="account-actions-heading">
      <PanelHeader id="account-actions-heading" icon={UserRound} title={t("accountActions")} />
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="text-sm text-muted-foreground">{t("logoutHint")}</p>
        <Button
          variant="secondary"
          size="lg"
          className="min-h-11"
          onClick={() => {
            void logout()
            router.push("/")
          }}
        >
          <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {tn("logout", "Log Out")}
        </Button>
      </div>
    </Panel>
  )
}

function SettingsSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-72 rounded-lg" />
      <Skeleton className="h-28 rounded-lg" />
    </LoadingRegion>
  )
}

export { SettingsPage }
