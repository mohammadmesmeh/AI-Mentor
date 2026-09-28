import { setRequestLocale } from "next-intl/server"
import { TaskDetailPage } from "@/features/dashboard/components/pages/task-detail-page"

export default async function Page({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  return <TaskDetailPage taskId={decodeURIComponent(id)} />
}
