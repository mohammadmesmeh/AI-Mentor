"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { findNavItem } from "./navItems"

/**
 * The desktop top bar: where you are (group / page, and the parent page as a
 * link on pages below it) plus language and theme. Phones and tablets use the
 * header in DashboardWorkspaceNav instead.
 */
function WorkspaceTopBar() {
  const t = useT("workspace")
  const pathname = usePathname() ?? ""
  const match = findNavItem(pathname)
  const isChild = match !== null && pathname !== match.item.href

  return (
    <header className="glass-bar sticky top-0 z-30 hidden h-18 items-center justify-between gap-4 border-b px-8 lg:flex">
      {match ? (
        <nav aria-label={t("breadcrumbLabel")} className="text-[0.8125rem] text-muted-foreground">
          <ol className="m-0 flex list-none items-center gap-1.5 p-0">
            <li>{t(match.group.labelKey)}</li>
            <li aria-hidden="true">/</li>
            <li>
              {isChild ? (
                <Link href={match.item.href} className="text-secondary-700 no-underline hover:underline dark:text-secondary-300">
                  {t(match.item.labelKey)}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-ink">
                  {t(match.item.labelKey)}
                </span>
              )}
            </li>
            {isChild && (
              <>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="font-semibold text-ink">
                  {t("breadcrumbDetail")}
                </li>
              </>
            )}
          </ol>
        </nav>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}

export { WorkspaceTopBar }
