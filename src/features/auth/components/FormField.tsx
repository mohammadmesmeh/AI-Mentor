import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

function FormField({ label, required = false, error, children }: FormFieldProps) {
  const id = useId()

  let control = children
  if (isValidElement(children) && typeof children.type === "string") {
    control = cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, {
      id,
      "aria-describedby": error ? `${id}-error` : undefined,
    })
  }

  return (
    <div className="space-y-2 text-start">
      <label htmlFor={id} className="text-sm font-semibold text-[#12314D]">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {control}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger-500">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField, type FormFieldProps }