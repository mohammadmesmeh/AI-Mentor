"use client"

import { useLocale } from "next-intl"
import { useSwitchLocale } from "@/shared/hooks/useSwitchLocale"
import { cn } from "@/lib/utils"

const locales = [
  { value: "en", label: "EN" },
  { value: "ar", label: "AR" },
] as const

function LanguageSwitcher({ mobile = false }: { mobile?: boolean }) {
  const currentLocale = useLocale()
  const switchTo = useSwitchLocale()

  const switchLocale = (nextLocale: "en" | "ar") => {
    void switchTo(nextLocale)
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
