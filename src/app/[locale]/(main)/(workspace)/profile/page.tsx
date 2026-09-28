import { setRequestLocale } from "next-intl/server"
import { ProfilePage } from "@/features/account/components/pages/profile-page"

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ProfilePage />
}
