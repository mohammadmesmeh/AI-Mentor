import type { ReactNode } from "react"

interface FormFieldProps {
  label: string
  error?: string
  children: ReactNode
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2 text-left">
      <label className="text-sm font-medium text-foreground p-3 ">{label}</label>
      {children}
      {error && <p className="text-sm text-danger-500 px-3">{error}</p>}
    </div>
  )
}

export { FormField, type FormFieldProps }
