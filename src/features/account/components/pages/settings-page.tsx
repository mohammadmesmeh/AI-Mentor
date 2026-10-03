"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { skipToken } from "@reduxjs/toolkit/query"
import { useLocale } from "next-intl"
import { LogOut } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Button } from "@/shared/components/ui/Button"
import { FilterTabs } from "@/shared/components/ui/FilterTabs"
import { useTheme } from "@/shared/components/providers/ThemeProvider"
import { useSwitchLocale } from "@/shared/hooks/useSwitchLocale"
import type { RootState } from "@/redux/store"
import { useGetPreferencesQuery, useLogoutMutation, useUpdatePreferencesMutation } from "@/lib/api/apiSlice"
import type { Preferences, ResourceLanguage, UiLocale } from "@/lib/api/types"
import { resourceLanguageKeyMap } from "@/features/onboarding/lib/profileLabels"
import { ErrorState, SignedOutState } from "@/features/dashboard/components/learning/shared"
import {
  CardSkeleton,
  LoadingRegion,
  PageHeader,
  Skeleton,
  WorkspaceCard,
} from "@/features/dashboard/components/ui/workspace"
import { SaveStatus, SettingRow, type SaveState } from "../controls"

/**
 * Only what the contract supports (§11): ui_locale and resource_language via
 * PATCH /me/preferences (the time zone is no longer a learner setting), plus the local theme and sign-out. There
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
    <div className="animate-fade-in space-y-5">
      <PageHeader title={t("settingsTitle")} description={t("settingsDescription")} />
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
    <WorkspaceCard titleId="appearance-heading" title={t("appearanceSection")}>
      <SettingRow
        labelId="ui-locale-label"
        label={t("interfaceLanguage")}
        hint={t("interfaceLanguageHint")}
        status={<SaveStatus state={localeSave} labels={labels} />}
      >
        <FilterTabs<UiLocale>
          labelledBy="ui-locale-label"
          options={[
            { value: "ar", label: "العربية", lang: "ar" },
            { value: "en", label: "English", lang: "en" },
          ]}
          value={locale}
          onChange={(next) => {
            if (next === locale) return
            setLocaleSave("saving")
            // Route change + PATCH ui_locale; the store and cache survive.
            void switchLocale(next).then((ok) => setLocaleSave(ok ? "saved" : "failed"))
          }}
        />
      </SettingRow>
      <SettingRow labelId="theme-label" label={t("theme")} hint={t("themeHint")}>
        <FilterTabs<"light" | "dark">
          labelledBy="theme-label"
          options={[
            { value: "light", label: t("themeLight") },
            { value: "dark", label: t("themeDark") },
          ]}
          value={theme}
          onChange={setTheme}
        />
      </SettingRow>
    </WorkspaceCard>
  )
}

function LearningPreferencesPanel({ preferences }: { preferences: Preferences | null }) {
  const t = useT("account")
  const to = useT("onboarding")
  const labels = useStatusLabels()
  const [updatePreferences] = useUpdatePreferencesMutation()
  const [resourceSave, setResourceSave] = useState<SaveState>("idle")

  if (!preferences) {
    return (
      <WorkspaceCard titleId="learning-prefs-heading" title={t("learningPrefsSection")}>
        <p role="alert" className="m-0 text-muted-foreground">
          {t("preferencesUnavailable")}
        </p>
      </WorkspaceCard>
    )
  }

  const save = (patch: { resourceLanguage: ResourceLanguage }, setState: (s: SaveState) => void) => {
    setState("saving")
    updatePreferences(patch)
      .unwrap()
      .then(() => setState("saved"))
      .catch(() => setState("failed"))
  }

  return (
    <WorkspaceCard titleId="learning-prefs-heading" title={t("learningPrefsSection")}>
      <SettingRow
        labelId="resource-language-label"
        label={t("resourceLanguage")}
        hint={t("resourceLanguageHint")}
        status={<SaveStatus state={resourceSave} labels={labels} />}
      >
        <FilterTabs<ResourceLanguage>
          labelledBy="resource-language-label"
          disabled={resourceSave === "saving"}
          options={(["ar", "en", "both"] as const).map((value) => ({
            value,
            label: to(resourceLanguageKeyMap[value]),
          }))}
          value={preferences.resourceLanguage}
          onChange={(value) => {
            if (value !== preferences.resourceLanguage) save({ resourceLanguage: value }, setResourceSave)
          }}
        />
      </SettingRow>

    </WorkspaceCard>
  )
}

function AccountActionsPanel() {
  const t = useT("account")
  const tn = useT("nav")
  const router = useRouter()
  const [logout] = useLogoutMutation()
  return (
    <WorkspaceCard titleId="account-actions-heading" title={t("accountActions")}>
      <SettingRow labelId="logout-label" label={tn("logout", "Log Out")} hint={t("logoutHint")}>
        <Button
          variant="glass"
          size="lg"
          className="min-h-11"
          onClick={() => {
            void logout()
            router.push("/")
          }}
        >
          <LogOut className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {tn("logout", "Log Out")}
        </Button>
      </SettingRow>
    </WorkspaceCard>
  )
}

function SettingsSkeleton() {
  const t = useT("workspace")
  return (
    <LoadingRegion label={t("loading")}>
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
        <CardSkeleton className="h-60" />
        <CardSkeleton className="h-60" />
        <CardSkeleton className="h-36" />
      </div>
    </LoadingRegion>
  )
}

export { SettingsPage }
