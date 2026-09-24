"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { AuthForm } from "../AuthForm"
import { AuthBrandPanel } from "../AuthBrandPanel"
import { useGetOnboardingStatusQuery } from "@/lib/api/apiSlice"
import type { RootState } from "@/redux/store"
import type { AuthViewMode } from "../../types/auth.types"

function AuthPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const t = useTranslations("footer")
  // Lifted out of AuthForm so the brand panel can vary its copy with the
  // view too, instead of always showing the sign-in marketing content.
  const [viewMode, setViewMode] = useState<AuthViewMode>("sign-in")

  if (isAuthenticated) {
    return <SessionRouter />
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden py-8 text-foreground md:py-12 lg:py-16">
      <Container className="relative z-10 my-auto max-w-5xl">
        <div className="grid overflow-hidden rounded-[24px] border border-border bg-card/95 shadow-[0_30px_70px_-20px_rgba(2,32,71,0.25)] backdrop-blur-md md:min-h-[580px] md:grid-cols-12">
          <AuthBrandPanel mode={viewMode} />
          <section className="p-8 sm:p-10 md:p-12 md:col-span-7">
            <AuthForm viewMode={viewMode} onViewModeChange={setViewMode} />
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