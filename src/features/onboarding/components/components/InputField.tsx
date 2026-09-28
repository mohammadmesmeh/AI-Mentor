"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

interface InputFieldProps {
  label?: string
  /** Accessible name when there is no visible label (e.g. the step's h1 names the field). */
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  multiline?: boolean
  rows?: number
  type?: "text" | "number"
  min?: number
  max?: number
  className?: string
  inputClassName?: string
}

function InputField({
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  error,
  multiline,
  rows = 4,
  type = "text",
  min,
  max,
  className,
  inputClassName,
}: InputFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const a11y = {
    id,
    "aria-label": label ? undefined : ariaLabel,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  }
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          {...a11y}
          dir="auto"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn("input resize-none min-h-[120px]", inputClassName)}
        />
      ) : (
        <input
          {...a11y}
          dir={type === "text" ? "auto" : undefined}
          type={type}
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("input", inputClassName)}
        />
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger-600 dark:text-danger-500" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}

export { InputField, type InputFieldProps }
