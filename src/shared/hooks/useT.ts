import { useTranslations } from "next-intl"

type TranslateValues = Record<string, string | number>

export type TranslateFn = (
  key: string,
  fallback?: string,
  values?: TranslateValues
) => string

/* Thin wrapper over next-intl's useTranslations that adds a fallback string
   per key: t(key, fallback?, values?). If the key (or its namespace) is
   missing at runtime, the fallback is returned instead of throwing, so UI
   never breaks for untranslated keys. */
export function useT(namespace: string): TranslateFn {
  const t = useTranslations(namespace) as unknown as (
    key: string,
    values?: TranslateValues
  ) => string

  return (key, fallback, values) => {
    try {
      const value = t(key, values)
      if (typeof value === "string" && value.length > 0 && value !== key) {
        return value
      }
    } catch {
      // namespace/key missing — fall through to the fallback
    }
    return fallback ?? key
  }
}
