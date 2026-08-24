import { AuthPage } from "@/features/auth/components/pages/auth-page"
import { setRequestLocale } from "next-intl/server"

export default async function Auth({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AuthPage />
}
