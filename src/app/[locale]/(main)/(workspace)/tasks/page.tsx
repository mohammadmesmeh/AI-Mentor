import { setRequestLocale } from "next-intl/server"
import { TasksPage } from "@/features/dashboard/components/pages/tasks-page"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <TasksPage />
}
