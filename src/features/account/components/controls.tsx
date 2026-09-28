"use client"

import { Check, Loader2, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A labelled group of real radio inputs drawn as selectable cards. Keyboard:
 * arrow keys move between options (native radio behavior); the focus ring is on
 * the card. 44px minimum height for touch.
 */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  hint,
  options,
  value,
  onChange,
  disabled,
  columns = 2,
  trailing,
}: {
  name: string
  legend: string
  hint?: string
  options: { value: T; label: string; description?: string; lang?: string }[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
  columns?: 2 | 3
  trailing?: React.ReactNode
}) {
  const hintId = hint ? `${name}-hint` : undefined
  const labelId = `${name}-legend`
  // The legend must be the fieldset's first child; the group is named by the
  // label text only, so the save status next to it isn't read as the name.
  return (
    <fieldset className="space-y-3" aria-labelledby={labelId} aria-describedby={hintId} disabled={disabled}>
      <legend className="flex w-full flex-wrap items-baseline justify-between gap-2">
        <span id={labelId} className="font-medium text-foreground">
          {legend}
        </span>
        {trailing}
      </legend>
      {hint && (
        <p id={hintId} className="-mt-2 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <div className={cn("grid gap-2", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors duration-200",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
                checked ? "border-primary bg-primary/5 dark:border-primary-300" : "border-border bg-card hover:bg-muted/60"
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="min-w-0">
                <span lang={option.lang} className="block text-sm font-medium text-foreground">
                  {option.label}
                </span>
                {option.description && (
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                )}
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
    <span role="status" aria-live="polite" className="inline-flex min-h-5 items-center gap-1.5 text-xs">
      {state === "saving" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-muted-foreground">{labels.saving}</span>
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="h-3.5 w-3.5 text-success-600 dark:text-success-500" aria-hidden="true" />
          <span className="text-success-600 dark:text-success-500">{labels.saved}</span>
        </>
      )}
      {state === "failed" && (
        <>
          <TriangleAlert className="h-3.5 w-3.5 text-danger-600 dark:text-danger-500" aria-hidden="true" />
          <span className="text-danger-600 dark:text-danger-500">{labels.failed}</span>
        </>
      )}
    </span>
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
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children(describedBy)}
      {hintId && (
        <p id={hintId ?? undefined} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId ?? undefined} className="text-xs text-danger-600 dark:text-danger-500">
          {error}
        </p>
      )}
    </div>
  )
}
