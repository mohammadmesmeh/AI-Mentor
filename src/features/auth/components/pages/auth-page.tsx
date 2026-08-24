"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { AuthForm } from "../AuthForm"
import type { RootState } from "@/redux/store"

function AuthPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const onboarding = useSelector((state: RootState) => state.onboarding)
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) return
    if (onboarding.isComplete) {
      router.push("/dashboard")
    } else {
      router.push("/onboarding")
    }
  }, [isAuthenticated, onboarding.isComplete, router])

  if (isAuthenticated) return null

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-sm text-center">
        <FadeInView>
          <h1 className="text-heading-md font-semibold text-foreground">
            {t("welcomeTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("welcomeDescription")}
          </p>
        </FadeInView>

        <div className="mt-10">
          <FadeInView delay={0.1}>
            <AuthForm />
          </FadeInView>
        </div>
      </div>
    </Container>
  )
}

export { AuthPage }
