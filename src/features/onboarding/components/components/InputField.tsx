"use client"

import { cn } from "@/lib/utils"

interface InputFieldProps {
  label?: string
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
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn("input resize-none min-h-[120px]", inputClassName)}
        />
      ) : (
        <input
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
        <p className="text-sm text-danger-500" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}

export { InputField, type InputFieldProps }
