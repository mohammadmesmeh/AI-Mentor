"use client"

import { Check, CircleAlert, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Text inputs and textareas on glass cards; an invalid field gets a navy ring (no red). */
export const inputClass =
  "input min-h-11 bg-glass-strong aria-invalid:border-primary-900 aria-invalid:ring-2 aria-invalid:ring-primary-900/15 dark:aria-invalid:border-status-completed"

/** The time zone Select's trigger — and its same-size placeholder while it loads. */
export const selectTriggerClass =
  "flex h-11 w-full min-w-60 items-center justify-between rounded-md border border-line bg-glass-strong px-3 text-sm text-ink md:w-64"

/**
 * A labelled group of real radio inputs drawn as selectable cards. Keyboard:
 * arrow keys move between options (native radio behavior); the focus ring is on
 * the card. 44px minimum height for touch.
 */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  columns = 2,
}: {
  name: string
  legend: string
  options: { value: T; label: string; description?: string }[]
  value: T | null
  onChange: (value: T) => void
  columns?: 2 | 3
}) {
  return (
    <fieldset className="m-0 space-y-3 border-0 p-0">
      <legend className="p-0 text-sm font-semibold text-ink">{legend}</legend>
      <div className={cn("grid gap-2", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors duration-200",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                checked ? "border-primary-900 bg-secondary-100/60 dark:border-status-completed dark:bg-secondary-300/10" : "border-line bg-glass-strong hover:bg-card"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                {option.description && <span className="block text-xs text-muted-foreground">{option.description}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export type SaveState = "idle" | "saving" | "saved" | "failed"

/** Inline, announced result of an automatic save. */
export function SaveStatus({
  state,
  labels,
}: {
  state: SaveState
  labels: { saving: string; saved: string; failed: string }
}) {
  return (
    <span role="status" aria-live="polite" className="inline-flex min-h-5 items-center gap-1.5 text-xs font-medium">
      {state === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin text-status-neutral motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-muted-foreground">{labels.saving}</span>
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-3.5 text-status-completed" aria-hidden="true" />
          <span className="text-status-completed">{labels.saved}</span>
        </>
      )}
      {state === "failed" && (
        <>
          <CircleAlert className="size-3.5 text-ink" aria-hidden="true" />
          <span className="text-ink">{labels.failed}</span>
        </>
      )}
    </span>
  )
}

/** A field's validation message: navy text with an icon (never red). */
export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="m-0 flex items-center gap-1.5 text-xs font-medium text-ink">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

/** A form field wrapper: label, control, hint and error wired with ids. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string | null
  children: (describedBy: string | undefined) => React.ReactNode
}) {
  // The hint is replaced by the error when there is one.
  const hintId = hint && !error ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children(describedBy)}
      {hintId && (
        <p id={hintId} className="m-0 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId ?? undefined}>{error}</FieldError>}
    </div>
  )
}

/**
 * One setting: its label and hint on one side, the control on the other
 * (stacked on phones). `labelId` names the control (e.g. a FilterTabs list).
 */
export function SettingRow({
  labelId,
  label,
  hint,
  htmlFor,
  status,
  children,
}: {
  labelId: string
  label: string
  hint?: string
  /** For a native/labelable control, the label points at it. */
  htmlFor?: string
  /** The save status, shown under the hint. */
  status?: React.ReactNode
  children: React.ReactNode
}) {
  const Label = htmlFor ? "label" : "p"
  return (
    <div className="flex flex-col gap-3 border-t border-line py-4 first:border-t-0 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0 space-y-0.5">
        <Label id={labelId} htmlFor={htmlFor} className="m-0 block text-[0.9375rem] font-semibold text-ink">
          {label}
        </Label>
        {hint && <p className="m-0 text-[0.8125rem] text-muted-foreground">{hint}</p>}
        {status}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">{children}</div>
    </div>
  )
}
