"use client"

import { cn } from "@/lib/utils"

interface FilterOption<T extends string> {
  value: T
  label: string
  count: number
}

/**
 * A single-choice filter as a row of pill toggle buttons (aria-pressed).
 * 44px tall for touch; wraps on narrow screens instead of scrolling sideways.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted/60"
            )}
          >
            {option.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs tabular-nums",
                selected ? "bg-primary-foreground/15" : "bg-muted text-muted-foreground"
              )}
            >
              {option.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
