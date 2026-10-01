"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/hooks/useT"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { findNavItem } from "./navItems"

const CRUMB_LINK =
  "rounded-sm no-underline transition-colors hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * The desktop top bar: where you are as links (group → its first page, then
 * the page; a detail page adds itself last) plus language and theme. Phones
 * and tablets use the header in DashboardWorkspaceNav instead.
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
            <li>
              <Link href={match.group.items[0].href} className={CRUMB_LINK}>
                {t(match.group.labelKey)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={match.item.href}
                aria-current={isChild ? undefined : "page"}
                className={cn(CRUMB_LINK, isChild ? "text-secondary-700 dark:text-secondary-300" : "font-semibold text-ink")}
              >
                {t(match.item.labelKey)}
              </Link>
            </li>
            {isChild && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={pathname} aria-current="page" className={cn(CRUMB_LINK, "font-semibold text-ink")}>
                    {t("breadcrumbDetail")}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <LanguageSwitcher workspace />
        <ThemeToggle workspace />
      </div>
    </header>
  )
}

export { WorkspaceTopBar }
