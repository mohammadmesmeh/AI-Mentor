import type { ReactNode } from "react"

interface FormFieldProps {
  label: string
  error?: string
  children: ReactNode
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2 text-start">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  )
}

export { FormField, type FormFieldProps }
