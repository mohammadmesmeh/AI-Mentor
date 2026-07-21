import { getTranslations } from "next-intl/server"
import { LoadingScreen } from "@/shared/components/ui/LoadingScreen"

export default async function Loading() {
  const t = await getTranslations("loading")
  return <LoadingScreen text={t("text")} />
}
