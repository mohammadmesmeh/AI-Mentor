"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { AuthForm } from "../AuthForm"
import { AuthBrandPanel } from "../AuthBrandPanel"
import type { RootState } from "@/redux/store"

function AuthPage() {
  const router = useRouter()
  const onboarding = useSelector((state: RootState) => state.onboarding)
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const t = useTranslations("footer")

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
    <div className="relative flex flex-1 flex-col overflow-hidden py-8 text-foreground md:py-12 lg:py-16">
      <Container className="relative z-10 my-auto max-w-5xl">
        <div className="grid overflow-hidden rounded-[24px] border border-border bg-card/95 shadow-[0_30px_70px_-20px_rgba(2,32,71,0.25)] backdrop-blur-md md:min-h-[580px] md:grid-cols-12">
          <AuthBrandPanel />
          <section className="p-8 sm:p-10 md:p-12 md:col-span-7">
            <AuthForm />
          </section>
        </div>
      </Container>

      <footer className="relative z-10 mt-8 flex items-center justify-center border-t border-border/60 pt-5">
        <p className="text-xs text-muted-foreground">{t("copyright")}</p>
      </footer>
    </div>
  )
}

export { AuthPage }