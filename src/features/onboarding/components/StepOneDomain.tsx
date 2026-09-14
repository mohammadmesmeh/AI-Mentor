"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { InputField } from "./components/InputField"
import { StepNavigation } from "./components/StepNavigation"

interface StepOneDomainProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

function StepOneDomain({ value, onChange, onNext }: StepOneDomainProps) {
  const t = useTranslations("onboarding")
  const [error, setError] = useState("")

  const handleContinue = () => {
    if (!value.trim()) {
      setError(t("stepOneError"))
      return
    }
    setError("")
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="font-display text-heading-md font-bold tracking-tight text-foreground outline-none sm:text-[26px]"
          tabIndex={-1}
        >
          {t("stepOneTitle")}
        </h1>
        <p className="text-muted-foreground">{t("stepOneDescription")}</p>
      </div>
      <InputField
        value={value}
        onChange={(v) => {
          onChange(v)
          if (error) setError("")
        }}
        placeholder={t("stepOnePlaceholder")}
        error={error}
        inputClassName="p-4 rounded-xl"
      />
      <StepNavigation onContinue={handleContinue} canContinue={!!value.trim()} />
    </div>
  )
}

export { StepOneDomain, type StepOneDomainProps }