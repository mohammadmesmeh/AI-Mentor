import { DashboardWorkspaceNav } from "./DashboardWorkspaceNav"
import { WorkspaceTopBar } from "./WorkspaceTopBar"

/** Sidebar + top bar over the soft blue canvas; pages render in the main column. */
function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-canvas min-h-dvh">
      <DashboardWorkspaceNav />
      <div className="flex min-h-dvh flex-col lg:ps-66">
        <WorkspaceTopBar />
        <div className="mx-auto w-full max-w-(--container-wide) flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export { DashboardShell }
