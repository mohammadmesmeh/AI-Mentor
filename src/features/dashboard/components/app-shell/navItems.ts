import {
  BookOpen,
  ChartLine,
  LayoutGrid,
  ListChecks,
  Map as MapIcon,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { WORKSPACE_ROUTES } from "@/lib/workspaceRoutes"

export interface NavItem {
  href: string
  icon: LucideIcon
  /** Key in the `workspace` namespace. */
  labelKey: string
}

export interface NavGroup {
  labelKey: string
  items: NavItem[]
}

/** The sidebar, in order; also the source of the top bar's breadcrumb. */
export const WORKSPACE_NAV: NavGroup[] = [
  {
    labelKey: "navLearning",
    items: [
      { href: WORKSPACE_ROUTES.overview, icon: LayoutGrid, labelKey: "navOverview" },
      { href: WORKSPACE_ROUTES.roadmap, icon: MapIcon, labelKey: "navRoadmap" },
      { href: WORKSPACE_ROUTES.tasks, icon: ListChecks, labelKey: "navTasks" },
      { href: WORKSPACE_ROUTES.resources, icon: BookOpen, labelKey: "navResources" },
      { href: WORKSPACE_ROUTES.progress, icon: ChartLine, labelKey: "navProgress" },
    ],
  },
  {
    labelKey: "navAccount",
    items: [
      { href: WORKSPACE_ROUTES.profile, icon: UserRound, labelKey: "navProfile" },
      { href: WORKSPACE_ROUTES.settings, icon: SlidersHorizontal, labelKey: "navSettings" },
    ],
  },
]

/** A section is active on its own page and on pages below it (/tasks/123 → Tasks). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** The group and item a path belongs to, for the breadcrumb. */
export function findNavItem(pathname: string): { group: NavGroup; item: NavItem } | null {
  for (const group of WORKSPACE_NAV) {
    const item = group.items.find((candidate) => isActive(pathname, candidate.href))
    if (item) return { group, item }
  }
  return null
}
