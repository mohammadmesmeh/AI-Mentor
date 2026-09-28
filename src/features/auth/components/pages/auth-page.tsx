"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { AuthForm } from "../AuthForm"
import { AuthBrandPanel } from "../AuthBrandPanel"
import { useGetOnboardingStatusQuery } from "@/lib/api/apiSlice"
import type { RootState } from "@/redux/store"

function AuthPage() {
  const { isAuthenticated, restoring } = useSelector((state: RootState) => state.auth)
  const t = useTranslations("footer")

  if (isAuthenticated) {
    return <SessionRouter />
  }
  // A reload may still have a cookie session being restored: don't offer the
  // form yet — an established session routes onward instead.
  if (restoring) {
    return <div className="flex-1" aria-busy="true" />
  }

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

/**
 * After a successful register/login the server's onboarding-status is the
 * authoritative gate (FR-011): route to /onboarding until the learning profile
 * is complete, then to the dashboard.
 */
function SessionRouter() {
  const router = useRouter()
  const { data: status, isLoading } = useGetOnboardingStatusQuery()

  useEffect(() => {
    if (isLoading) return
    router.replace(status?.completed ? "/dashboard" : "/onboarding")
  }, [status, isLoading, router])

  return null
}

export { AuthPage }