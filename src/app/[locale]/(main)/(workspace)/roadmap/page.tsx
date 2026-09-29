import { setRequestLocale } from "next-intl/server"
import { RoadmapPage } from "@/features/dashboard/components/pages/roadmap-page"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <RoadmapPage />
}
