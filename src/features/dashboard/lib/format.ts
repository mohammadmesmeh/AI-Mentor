import type { ResourceType } from "@/lib/api/types"
import type { ResourceItem } from "./learningItems"

/** "44%" in the page's locale (Arabic digits in Arabic). `value` is 0–100. */
export function formatPercent(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value / 100)
}

/** A count in the page's locale. */
export function formatNumber(locale: string, value: number): string {
  return new Intl.NumberFormat(locale).format(value)
}

/** Splits a minute total into whole hours and the minutes left over. */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  const safe = Math.max(0, Math.round(total))
  return { hours: Math.floor(safe / 60), minutes: safe % 60 }
}

/**
 * The translation key and values for a duration: "2 h 55 min", "3 h" or
 * "40 min" (keys under `workspace.duration`).
 */
export function durationMessage(total: number): { key: string; values: { hours: number; minutes: number } } {
  const values = splitMinutes(total)
  if (values.hours === 0) return { key: "duration.minutes", values }
  if (values.minutes === 0) return { key: "duration.hours", values }
  return { key: "duration.hoursMinutes", values }
}

/** How many resources of each type, in the given order, skipping types with none. */
export function resourceTypeCounts(
  items: ResourceItem[],
  order: readonly ResourceType[]
): { type: ResourceType; count: number }[] {
  return order
    .map((type) => ({ type, count: items.filter((item) => item.resource.type === type).length }))
    .filter(({ count }) => count > 0)
}
