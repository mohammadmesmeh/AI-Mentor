/**
 * The signed-in learning workspace: every page rendered inside the dashboard
 * shell (src/app/[locale]/(main)/(workspace)). The marketing navbar and footer
 * stay out of these pages.
 */
export const WORKSPACE_ROUTES = {
  overview: "/dashboard",
  roadmap: "/roadmap",
  tasks: "/tasks",
  resources: "/resources",
  profile: "/profile",
  settings: "/settings",
} as const

export function taskPath(taskId: string): string {
  return `${WORKSPACE_ROUTES.tasks}/${encodeURIComponent(taskId)}`
}

export function isWorkspacePath(pathname: string | null | undefined): boolean {
  if (typeof pathname !== "string") return false
  return Object.values(WORKSPACE_ROUTES).some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
