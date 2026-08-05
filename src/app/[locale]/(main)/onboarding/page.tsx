import { OnboardingPage } from "@/features/onboarding/components/pages/onboarding-page"
import { setRequestLocale } from "next-intl/server"

export default async function Onboarding({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <OnboardingPage />
}
