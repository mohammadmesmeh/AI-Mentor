"use client"

import { useMobileMenu } from "@/shared/hooks/useMobileMenu"
import { Container } from "@/shared/components/ui/Container"
import { Button } from "@/shared/components/ui/Button"
import { cn } from "@/lib/utils"
import { Logo } from "./Logo"
import { MobileMenuButton } from "./MobileMenuButton"
import  {NavLinks}  from "./NavLinks"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
]



function Navbar() {
  const { isOpen: mobileOpen, toggle, close } = useMobileMenu()


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border light:bg-background/30 backdrop-blur-lg">
      <Container className="flex h-14 items-center justify-between">
       <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLinks key={link.href} link={link} />
          ))}
          <Button variant="primary" size="sm" >
            Get Started
          </Button>
        </nav>

       <MobileMenuButton isOpen={mobileOpen} toggle={toggle} />
      </Container>

      <div
        id="mobile-menu"
        role="region"
        aria-label="Mobile navigation"
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out md:hidden",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <Container className="flex flex-col gap-3 pb-4 pt-2">
          {navLinks.map((link) => (
            <NavLinks key={link.href} link={link} onClick={close} />
          ))}
          <Button
            variant="primary"
            className="mt-2 w-full"
            onClick={close}
          >
            Get Started
          </Button>
        </Container>
      </div>
    </header>
  )
}

export { Navbar }
