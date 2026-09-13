"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Home, LayoutGrid, Menu, X, type LucideIcon } from "lucide-react"

import { Link, usePathname } from "@/i18n/navigation"
import { useT } from "@/shared/hooks/useT"
import { Logo } from "@/shared/components/layout/navbar/Logo"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { cn } from "@/lib/utils"
import type { RootState } from "@/redux/store"

const workspaceLinks = [
  { href: "/dashboard", icon: LayoutGrid, labelKey: "navOverview" },
  { href: "/", icon: Home, labelKey: "navHome" },
] as const

interface WorkspaceLinkProps {
  href: string
  icon: LucideIcon
  label: string
  active: boolean
  onNavigate?: () => void
  className?: string
}

function WorkspaceLink({ href, icon: Icon, label, active, onNavigate, className }: WorkspaceLinkProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        className
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary"
        />
      )}
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

function DashboardWorkspaceNav() {
  const t = useT("dashboard")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const learnerName = useSelector((state: RootState) => state.auth.user?.name)

  const closeDrawer = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  const isActive = (href: string) => pathname === href

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-border/50 bg-card/60 backdrop-blur-md lg:flex">
        <div className="flex h-16 items-center border-b border-border/50 px-4">
          <Logo />
        </div>
        <nav
          aria-label={t("navLabel", "Learning workspace navigation")}
          className="flex-1 space-y-2 overflow-y-auto p-3"
        >
          {workspaceLinks.map(({ href, icon, labelKey }) => (
            <WorkspaceLink
              key={href}
              href={href}
              icon={icon}
              label={t(labelKey, labelKey)}
              active={isActive(href)}
            />
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-border/50 p-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {learnerName && (
            <span className="ms-auto min-w-0 truncate text-xs font-medium text-muted-foreground">
              {learnerName}
            </span>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border/40 bg-background/70 px-4 backdrop-blur-md lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="dashboard-nav-drawer"
            aria-label={
              open
                ? t("navMenuCloseAria", "Close navigation")
                : t("navMenuOpenAria", "Open navigation")
            }
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <div
        id="dashboard-nav-drawer"
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeDrawer}
        />
        <aside
          className={cn(
            "absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col border-e border-border/70 bg-background shadow-lg transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
            <Logo />
            <button
              type="button"
              aria-label={t("navMenuCloseAria", "Close navigation")}
              onClick={closeDrawer}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav
            aria-label={t("navLabel", "Learning workspace navigation")}
            className="flex-1 space-y-2 overflow-y-auto p-3"
          >
            {workspaceLinks.map(({ href, icon, labelKey }) => (
              <WorkspaceLink
                key={href}
                href={href}
                icon={icon}
                label={t(labelKey, labelKey)}
                active={isActive(href)}
                onNavigate={closeDrawer}
              />
            ))}
          </nav>
          <div className="flex items-center gap-2 border-t border-border/50 p-4">
            <LanguageSwitcher mobile />
            <ThemeToggle mobile />
          </div>
        </aside>
      </div>
    </>
  )
}

export { DashboardWorkspaceNav }