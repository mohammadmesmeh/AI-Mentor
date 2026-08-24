"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"

const DIRECTION_BY_LOCALE: Record<string, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
}

const FALLBACK_DIR: "ltr" | "rtl" = "ltr"

function LocaleProvider() {
  const locale = useLocale()

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = DIRECTION_BY_LOCALE[locale] ?? FALLBACK_DIR
  }, [locale])

  return null
}

export { LocaleProvider }