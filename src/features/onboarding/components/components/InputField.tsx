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
  className?: string
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  error,
  multiline,
  rows = 4,
  className,
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
          className="input resize-none min-h-[120px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input"
        />
      )}
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  )
}

export { InputField, type InputFieldProps }
