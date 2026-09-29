"use client"

import { useLocale } from "next-intl"
import { Globe } from "lucide-react"
import { useSwitchLocale } from "@/shared/hooks/useSwitchLocale"
import { cn } from "@/lib/utils"

const locales = [
  { value: "en", label: "EN" },
  { value: "ar", label: "AR" },
] as const

/** Each language named in itself, for the workspace's single switch button. */
const OTHER_LOCALE = {
  ar: { value: "en", name: "English" },
  en: { value: "ar", name: "العربية" },
} as const

function LanguageSwitcher({ mobile = false, workspace = false }: { mobile?: boolean; workspace?: boolean }) {
  const currentLocale = useLocale()
  const switchTo = useSwitchLocale()

  const switchLocale = (nextLocale: "en" | "ar") => {
    void switchTo(nextLocale)
  }

  if (workspace) {
    const other = OTHER_LOCALE[currentLocale === "en" ? "en" : "ar"]
    return (
      <button
        type="button"
        lang={other.value}
        onClick={() => switchLocale(other.value)}
        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-line bg-glass-strong px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Globe className="size-4" aria-hidden="true" />
        {other.name}
      </button>
    )
  }

  if (mobile) {
    return (
      <div className="flex items-center gap-1 self-start rounded-lg bg-muted/50 p-1">
        {locales.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            lang={value}
            aria-pressed={currentLocale === value}
            onClick={() => switchLocale(value)}
            className={cn(
              "font-ui cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
              currentLocale === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border/50 bg-background/50 p-0.5 backdrop-blur-sm">
      {locales.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={currentLocale === value}
          onClick={() => switchLocale(value)}
            className={cn(
              "font-ui cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200",
              currentLocale === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export { LanguageSwitcher }
