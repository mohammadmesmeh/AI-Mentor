import { Container } from "@/shared/components/ui/Container"
import { Logo } from "./navbar/Logo"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background/30 backdrop-blur-lg">
      <Container className="flex flex-col gap-4 py-8 text-center md:flex-row md:items-center md:justify-between md:text-start">

        <div className="flex flex-col gap-2">
          <Logo />

          <p className="max-w-sm text-xs text-muted-foreground">
            Guiding your growth with intelligent AI solutions designed to
            inspire, learn, and achieve more.
          </p>
        </div>


        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground md:items-end">

          <p>
            © {currentYear} AI Mentor. All rights reserved.
          </p>

          <p>
            Powered by AI & innovation.
          </p>

        </div>

      </Container>
    </footer>
  )
}

export { Footer }