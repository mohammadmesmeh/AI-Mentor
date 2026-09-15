import { DashboardWorkspaceNav } from "./DashboardWorkspaceNav"
import { Container } from "@/shared/components/ui/Container"

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <DashboardWorkspaceNav />
      <div className="lg:ps-64">
        <Container className="py-8">{children}</Container>
      </div>
    </div>
  )
}

export { DashboardShell }