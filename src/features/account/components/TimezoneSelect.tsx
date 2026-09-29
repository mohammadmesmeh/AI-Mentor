"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { selectTriggerClass } from "./controls"

/**
 * The time zone picker (shadcn Select). Its own module so the settings page
 * can load it after first paint (next/dynamic) — the menu code is the heaviest
 * part of the page.
 */
export default function TimezoneSelect({
  id,
  options,
  value,
  disabled,
  onChange,
}: {
  id: string
  options: { value: string; label: string }[]
  value: string
  disabled: boolean
  onChange: (zone: string) => void
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(zone) => {
        if (typeof zone === "string" && zone !== value) onChange(zone)
      }}
      items={options}
    >
      <SelectTrigger id={id} dir="ltr" className={selectTriggerClass}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent dir="ltr" className="max-h-80 rounded-md">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="min-h-9">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
