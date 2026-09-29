import { setRequestLocale } from "next-intl/server"
import { ResourcesPage } from "@/features/dashboard/components/pages/resources-page"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ResourcesPage />
}
