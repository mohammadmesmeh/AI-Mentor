/**
 * Weekly learning time (contract §12 `available_minutes_per_week`: an integer
 * from 15 to 10,080). The learner picks a preset or "Other" (a number plus a
 * unit); whatever they pick, the API always gets whole minutes.
 */

export const MIN_MINUTES_PER_WEEK = 15
export const MAX_MINUTES_PER_WEEK = 10_080

/** 30 min, 1 h, 2 h, 3 h, 5 h, 10 h a week. */
export const TIME_PRESETS = [30, 60, 120, 180, 300, 600] as const

export type TimeUnit = "minutes" | "hours"
export const TIME_UNITS: readonly TimeUnit[] = ["minutes", "hours"]

/** What the time control holds: a preset, or a custom amount as typed. */
export type TimeChoice =
  | { kind: "preset"; minutes: number }
  | { kind: "custom"; amount: string; unit: TimeUnit }

export type TimeError = "required" | "invalid" | "tooLow" | "tooHigh"

export function isPreset(minutes: number): boolean {
  return (TIME_PRESETS as readonly number[]).includes(minutes)
}

/** An amount in a unit as whole minutes; null when it isn't a positive number. */
export function toMinutes(amount: number, unit: TimeUnit): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round(unit === "hours" ? amount * 60 : amount)
}

/**
 * The clearest unit for a stored value: hours when it is a whole or half
 * hour (90 → 1.5 h), minutes otherwise (45 → 45 min).
 */
export function bestUnit(minutes: number): { amount: number; unit: TimeUnit } {
  return minutes >= 60 && minutes % 30 === 0
    ? { amount: minutes / 60, unit: "hours" }
    : { amount: minutes, unit: "minutes" }
}

/** A stored value back into the control: its preset, or "Other" in the best unit. */
export function choiceFromMinutes(minutes: number | null | undefined): TimeChoice | null {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return null
  if (isPreset(minutes)) return { kind: "preset", minutes }
  const { amount, unit } = bestUnit(minutes)
  return { kind: "custom", amount: String(amount), unit }
}

/**
 * The minutes a choice stands for. A typed amount accepts Western or
 * Arabic-Indic digits and a "." or "," decimal separator.
 */
export function choiceToMinutes(choice: TimeChoice | null): number | null {
  if (!choice) return null
  if (choice.kind === "preset") return choice.minutes
  const amount = parseAmount(choice.amount)
  return amount === null ? null : toMinutes(amount, choice.unit)
}

export function parseAmount(raw: string): number | null {
  const normalized = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, ".")
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

/** The contract's rule for the field, checked before the request. */
export function validateMinutes(minutes: number | null): TimeError | null {
  if (minutes === null || !Number.isFinite(minutes)) return "required"
  if (!Number.isInteger(minutes)) return "invalid"
  if (minutes < MIN_MINUTES_PER_WEEK) return "tooLow"
  if (minutes > MAX_MINUTES_PER_WEEK) return "tooHigh"
  return null
}

/** Validates a choice as the learner left it (an empty or unparsable amount is its own error). */
export function validateChoice(choice: TimeChoice | null): TimeError | null {
  if (!choice) return "required"
  if (choice.kind === "custom") {
    if (choice.amount.trim() === "") return "required"
    if (parseAmount(choice.amount) === null) return "invalid"
  }
  return validateMinutes(choiceToMinutes(choice))
}

/** `onboarding.*` message key for each error. */
export const timeErrorKeyMap: Record<TimeError, string> = {
  required: "timeErrorRequired",
  invalid: "timeErrorInvalid",
  tooLow: "timeErrorTooLow",
  tooHigh: "timeErrorTooHigh",
}

type Translate = (key: string, values?: Record<string, string | number>) => string

/**
 * "2 hours" / "ساعتان", in the clearest unit, with Western digits in both
 * languages: `count` picks the plural form, `n` is the number as shown.
 */
export function formatDuration(t: Translate, minutes: number): string {
  const { amount, unit } = bestUnit(minutes)
  const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)
  return t(unit === "hours" ? "durationHours" : "durationMinutes", { count: amount, n })
}

/** "2 hours per week" / "ساعتان بالأسبوع". */
export function formatWeekly(t: Translate, minutes: number): string {
  return t("perWeek", { duration: formatDuration(t, minutes) })
}
