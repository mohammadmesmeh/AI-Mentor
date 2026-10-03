"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TIME_UNITS, type TimeUnit } from "../../lib/timeCommitment"

const unitKeyMap: Record<TimeUnit, string> = { minutes: "unitMinutes", hours: "unitHours" }

/**
 * The "Other" time input: a number and its unit (minutes / hours). Shared by
 * the onboarding step and the Profile editor; each page shows the error itself
 * and passes its id, so the message keeps that page's style.
 */
function CustomTimeFields({
  id,
  amount,
  unit,
  onAmountChange,
  onUnitChange,
  invalid,
  describedBy,
  inputClassName,
}: {
  id: string
  amount: string
  unit: TimeUnit
  onAmountChange: (amount: string) => void
  onUnitChange: (unit: TimeUnit) => void
  invalid: boolean
  /** The hint and/or error ids that describe the amount input. */
  describedBy?: string
  inputClassName?: string
}) {
  const t = useTranslations("onboarding")
  const units = TIME_UNITS.map((value) => ({ value, label: t(unitKeyMap[value]) }))

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {t("customTimeLabel")}
      </label>
      <div className="flex gap-2">
        {/* Text + inputMode: a number input rejects Arabic-Indic digits and "," */}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          dir="ltr"
          autoComplete="off"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn("input min-h-11 w-32 min-w-0 text-start", inputClassName)}
        />
        <Select
          value={unit}
          onValueChange={(next) => {
            if (next === "minutes" || next === "hours") onUnitChange(next)
          }}
          items={units}
        >
          <SelectTrigger
            aria-label={t("timeUnitLabel")}
            className="h-11 min-w-32 rounded-md border-border bg-background px-3 text-sm text-foreground data-[size=default]:h-11"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            {units.map((option) => (
              <SelectItem key={option.value} value={option.value} className="min-h-11">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export { CustomTimeFields }
