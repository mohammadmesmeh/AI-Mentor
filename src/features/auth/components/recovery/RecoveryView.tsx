"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/shared/components/ui/Button"
import { FormField } from "../FormField"
import { authService } from "../../services/authService"
import type { PasswordResetResult } from "../../services/authService"

function RecoveryView() {
  const t = useTranslations("auth")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    const result: PasswordResetResult = await authService.requestPasswordReset(email)
    setIsSubmitting(false)
    if (result.status === "not-connected") {
      setMessage(t("resetUnavailable"))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label={t("email")} required>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className="input border-[#E2E8F0] bg-[#F8FAFC]"
          autoComplete="email"
        />
      </FormField>

      {message && <p className="text-sm text-danger-500">{message}</p>}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#617D94] px-6 py-2.5 text-white shadow-none hover:bg-[#4E677C] hover:scale-100 hover:shadow-none"
        >
          {isSubmitting ? t("requestingReset") : t("requestReset")}
        </Button>
      </div>
    </form>
  )
}

export { RecoveryView }