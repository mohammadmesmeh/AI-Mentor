"use client"

import { useId, useState } from "react"
import { useTranslations } from "next-intl"
import { OptionCard } from "./components/OptionCard"
import { CustomTimeFields } from "./components/CustomTimeFields"
import { StepNavigation } from "./components/StepNavigation"
import {
  TIME_PRESETS,
  choiceFromMinutes,
  choiceToMinutes,
  formatDuration,
  timeErrorKeyMap,
  validateChoice,
  type TimeChoice,
} from "../lib/timeCommitment"

interface StepThreeTimeCommitmentProps {
  /** Minutes per week (contract §12), null until chosen. */
  value: number | null
  /** The minutes the current choice stands for; null while "Other" is empty or invalid. */
  onChange: (value: number | null) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Weekly time: six presets (30 min … 10 h) or "Other" with a number and a
 * unit. Whatever the learner picks, the form holds whole minutes.
 */
function StepThreeTimeCommitment({
  value,
  onChange,
  onNext,
  onBack,
}: StepThreeTimeCommitmentProps) {
  const t = useTranslations("onboarding")
  const id = useId()
  const [choice, setChoice] = useState<TimeChoice | null>(() => choiceFromMinutes(value))
  // Set by Continue; a typed amount is also checked as the learner types.
  const [submitError, setSubmitError] = useState("")

  const update = (next: TimeChoice) => {
    setChoice(next)
    onChange(choiceToMinutes(next))
    setSubmitError("")
  }

  const custom = choice?.kind === "custom" ? choice : null
  const liveProblem = custom && custom.amount.trim() !== "" ? validateChoice(custom) : null
  const error = submitError || (liveProblem ? t(timeErrorKeyMap[liveProblem]) : "")

  const handleContinue = () => {
    const problem = validateChoice(choice)
    if (problem) {
      setSubmitError(t(timeErrorKeyMap[problem]))
      if (custom) document.getElementById(`${id}-amount`)?.focus()
      return
    }
    onNext()
  }

  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          className="font-display text-heading-md font-bold tracking-tight text-foreground outline-none"
          tabIndex={-1}
        >
          {t("stepFourTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("minutesRangeHint")}</p>
      </div>

      <div role="group" aria-label={t("timePresetsLabel")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TIME_PRESETS.map((minutes) => (
          <OptionCard
            key={minutes}
            title={formatDuration(t, minutes)}
            selected={choice?.kind === "preset" && choice.minutes === minutes}
            onClick={() => update({ kind: "preset", minutes })}
            className="p-4"
          />
        ))}
        <OptionCard
          title={t("timeOther")}
          description={t("timeOtherDescription")}
          selected={!!custom}
          onClick={() => {
            if (!custom) update({ kind: "custom", amount: "", unit: "hours" })
          }}
          className="col-span-2 p-4 sm:col-span-3"
        />
      </div>

      {custom && (
        <div className="space-y-2">
          <CustomTimeFields
            id={`${id}-amount`}
            amount={custom.amount}
            unit={custom.unit}
            onAmountChange={(amount) => update({ ...custom, amount })}
            onUnitChange={(unit) => update({ ...custom, unit })}
            invalid={!!error}
            describedBy={error ? errorId : hintId}
          />
          {!error && (
            <p id={hintId} className="text-xs text-muted-foreground">
              {t("customTimeHint")}
            </p>
          )}
        </div>
      )}

      {error && (
        <p id={errorId} className="text-sm text-danger-600 dark:text-danger-500" aria-live="polite">
          {error}
        </p>
      )}

      <StepNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={choice !== null}
      />
    </div>
  )
}

export { StepThreeTimeCommitment, type StepThreeTimeCommitmentProps }
