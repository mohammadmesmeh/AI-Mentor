import { DashboardWorkspaceNav } from "./DashboardWorkspaceNav"
import { Container } from "@/shared/components/ui/Container"
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle"

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <DashboardWorkspaceNav />
      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-2 border-b border-border/50 bg-background/60 px-6 backdrop-blur-md lg:flex">
          <ThemeToggle />
        </header>
        <Container className="py-8">{children}</Container>
      </div>
    </div>
  )
}

export { DashboardShell }