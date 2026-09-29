import { setRequestLocale } from "next-intl/server"
import { ProgressPage } from "@/features/dashboard/components/pages/progress-page"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ProgressPage />
}
