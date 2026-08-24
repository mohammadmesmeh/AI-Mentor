import { DashboardPage } from "@/features/dashboard/components/pages/dashboard-page"
import { setRequestLocale } from "next-intl/server"

export default async function Dashboard({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <DashboardPage />
}
