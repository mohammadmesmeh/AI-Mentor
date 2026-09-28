"use client"

import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import {
  BookOpen,
  LayoutGrid,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react"

import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useLogoutMutation } from "@/lib/api/apiSlice"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"
import { useT } from "@/shared/hooks/useT"
import { Logo } from "@/shared/components/layout/navbar/Logo"
import { LanguageSwitcher } from "@/shared/components/ui/LanguageSwitcher"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"
import { cn } from "@/lib/utils"
import type { RootState } from "@/redux/store"

interface NavItem {
  href: string
  icon: LucideIcon
  labelKey: string
}

const LEARNING_LINKS: NavItem[] = [
  { href: WORKSPACE_ROUTES.overview, icon: LayoutGrid, labelKey: "navOverview" },
  { href: WORKSPACE_ROUTES.roadmap, icon: MapIcon, labelKey: "navRoadmap" },
  { href: WORKSPACE_ROUTES.tasks, icon: ListChecks, labelKey: "navTasks" },
  { href: WORKSPACE_ROUTES.resources, icon: BookOpen, labelKey: "navResources" },
]

/** A section is active on its own page and on pages below it (/tasks/123 → Tasks). */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const itemClass = (active: boolean) =>
  cn(
    "relative flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    active
      ? "bg-primary/10 text-foreground dark:bg-primary-300/15"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
  )

function WorkspaceLink({ item, active, label }: { item: NavItem; active: boolean; label: string }) {
  const Icon = item.icon
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
      {active && (
        <span aria-hidden="true" className="absolute inset-y-2 start-0 w-1 rounded-full bg-primary dark:bg-primary-200" />
      )}
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

/**
 * The site navbar is hidden in the workspace, so sign-out lives here. The
 * local session ends at once (contract §3 rule 7); the revoke call runs in the
 * background.
 */
function LogoutButton() {
  const t = useT("nav")
  const router = useRouter()
  const [logout] = useLogoutMutation()
  const authenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  if (!authenticated) return null
  return (
    <button
      type="button"
      onClick={() => {
        void logout()
        router.push("/")
      }}
      className={itemClass(false)}
    >
      <LogOut className="h-5 w-5 shrink-0 rtl:-scale-x-100" aria-hidden="true" />
      <span>{t("logout", "Log Out")}</span>
    </button>
  )
}

function NavSections({ pathname }: { pathname: string }) {
  const t = useT("workspace")
  const headingClass = "px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground"
  return (
    <div className="flex flex-1 flex-col justify-between gap-6 overflow-y-auto p-3">
      <div>
        <p className={headingClass}>{t("navLearning")}</p>
        <ul className="space-y-1">
          {LEARNING_LINKS.map((item) => (
            <li key={item.href}>
              <WorkspaceLink item={item} active={isActive(pathname, item.href)} label={t(item.labelKey)} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className={headingClass}>{t("navAccount")}</p>
        <ul className="space-y-1">
          <li>
            <LogoutButton />
          </li>
        </ul>
      </div>
    </div>
  )
}

function DashboardWorkspaceNav() {
  const t = useT("dashboard")
  const pathname = usePathname() ?? ""
  const [open, setOpen] = useState(false)
  const learnerName = useSelector((state: RootState) => state.auth.user?.name)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close the drawer when a link navigates (state adjusted during render).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    // Move focus into the drawer; Escape closes it and returns focus to the toggle.
    drawerRef.current?.querySelector<HTMLElement>("[role=dialog] a, [role=dialog] button")?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  const navLabel = t("navLabel", "Learning workspace navigation")
  const close = () => {
    setOpen(false)
    toggleRef.current?.focus()
  }

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-border/50 bg-card/60 backdrop-blur-md lg:flex">
        <div className="flex h-16 items-center border-b border-border/50 px-4">
          <Logo />
        </div>
        <nav aria-label={navLabel} className="flex flex-1 flex-col overflow-hidden">
          <NavSections pathname={pathname} />
        </nav>
        <div className="flex items-center gap-2 border-t border-border/50 p-3">
          <LanguageSwitcher />
          <ThemeToggle />
          {learnerName && (
            <span dir="auto" className="ms-auto min-w-0 truncate text-xs font-medium text-muted-foreground">
              {learnerName}
            </span>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-md lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="dashboard-nav-drawer"
            aria-label={open ? t("navMenuCloseAria", "Close navigation") : t("navMenuOpenAria", "Open navigation")}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div
        id="dashboard-nav-drawer"
        ref={drawerRef}
        // Out of the tab order and the accessibility tree while closed.
        inert={!open}
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 motion-reduce:transition-none lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={navLabel}
          className={cn(
            "absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col border-e border-border/70 bg-background shadow-lg transition-transform duration-300 motion-reduce:transition-none",
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
            <Logo />
            <button
              type="button"
              aria-label={t("navMenuCloseAria", "Close navigation")}
              onClick={close}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label={navLabel} className="flex flex-1 flex-col overflow-hidden">
            <NavSections pathname={pathname} />
          </nav>
          <div className="flex items-center gap-2 border-t border-border/50 p-4">
            <LanguageSwitcher mobile />
            <ThemeToggle mobile />
          </div>
        </div>
      </div>
    </>
  )
}

export { DashboardWorkspaceNav }
