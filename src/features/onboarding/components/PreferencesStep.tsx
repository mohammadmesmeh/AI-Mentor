"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { StepNavigation } from "./components/StepNavigation"
import { useUpdatePreferencesMutation } from "@/lib/api/apiSlice"
import type { OnboardingFormState } from "@/redux/slices/onboardingSlice"

interface PreferencesStepProps {
  preferences: OnboardingFormState["preferences"]
  onChange: (patch: Partial<OnboardingFormState["preferences"]>) => void
  onNext: () => void
  onBack: () => void
}

const selectClass =
  "w-full rounded-lg border border-border bg-background p-3 text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

function PreferencesStep({ preferences, onChange, onNext, onBack }: PreferencesStepProps) {
  const t = useTranslations("onboarding")
  const [updatePreferences, { isLoading }] = useUpdatePreferencesMutation()
  const [error, setError] = useState<string | null>(null)

  const uiLocale = preferences.uiLocale === "ar" ? "ar" : "en"

  const handleContinue = async () => {
    setError(null)
    try {
      await updatePreferences({
        uiLocale: preferences.uiLocale,
        resourceLanguage: preferences.resourceLanguage,
      }).unwrap()
      onNext()
    } catch {
      setError(t("stepSixSubmitFailed"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="font-display text-heading-md font-bold tracking-tight text-foreground outline-none"
          tabIndex={-1}
        >
          {t("preferencesTitle")}
        </h1>
        <p className="text-muted-foreground">{t("preferencesDescription")}</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="pref-ui-locale" className="text-sm font-medium text-foreground">
            {t("uiLocaleLabel")}
          </label>
          <select
            id="pref-ui-locale"
            className={selectClass}
            value={uiLocale}
            onChange={(e) =>
              onChange({ uiLocale: e.target.value === "ar" ? "ar" : "en" })
            }
          >
            <option value="ar">{t("prefArabic")}</option>
            <option value="en">{t("prefEnglish")}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="pref-resource-language" className="text-sm font-medium text-foreground">
            {t("resourceLanguageLabel")}
          </label>
          <select
            id="pref-resource-language"
            className={selectClass}
            value={preferences.resourceLanguage}
            onChange={(e) =>
              onChange({
                resourceLanguage: e.target.value as OnboardingFormState["preferences"]["resourceLanguage"],
              })
            }
          >
            <option value="ar">{t("prefArabic")}</option>
            <option value="en">{t("prefEnglish")}</option>
            <option value="both">{t("prefBoth")}</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger-500" aria-live="polite">
          {error}
        </p>
      )}

      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        isLoading={isLoading}
      />
    </div>
  )
}

export { PreferencesStep, type PreferencesStepProps }