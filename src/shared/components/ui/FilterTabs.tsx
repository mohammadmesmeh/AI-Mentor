"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface FilterTabOption<T extends string> {
  value: T
  label: string
  /** Shown after the label (e.g. how many items the filter matches). */
  count?: number
  lang?: string
}

/**
 * A single choice drawn as a segmented control (shadcn Tabs list without
 * panels): status/type filters and settings choices. Arrow keys move between
 * options; wraps instead of scrolling sideways on narrow screens.
 */
export function FilterTabs<T extends string>({
  label,
  labelledBy,
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  /** Accessible name of the group (or pass `labelledBy`). */
  label?: string
  labelledBy?: string
  options: FilterTabOption<T>[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)} className={cn("w-fit max-w-full", className)}>
      <TabsList
        aria-label={label}
        aria-labelledby={labelledBy}
        className="h-auto max-w-full flex-wrap justify-start gap-1 rounded-icon bg-segment p-1"
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            lang={option.lang}
            disabled={disabled}
            className={cn(
              "h-9 flex-none gap-2 rounded-md px-3.5 text-sm font-semibold text-muted-foreground",
              "data-active:bg-card data-active:text-ink data-active:shadow-sm dark:data-active:border-transparent dark:data-active:bg-glass-strong"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="text-[0.8125rem] font-medium tabular-nums text-status-neutral">{option.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
