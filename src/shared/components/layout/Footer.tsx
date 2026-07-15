import { Container } from "@/shared/components/ui/Container"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <Container className="flex flex-col items-center gap-2 py-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">
            AI Mentor
          </span>
          <span className="text-xs text-muted-foreground">
            t.
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} AI Mentor. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}

export { Footer }
