"use client"

import { Container } from "@/shared/components/ui/Container"
import { Logo } from "./navbar/Logo"
import { TextReveal } from "@/shared/components/animations/TextReveal"
import { useTranslations } from "next-intl"

function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations("footer")

  return (
    <footer className="border-t border-border bg-background/30 backdrop-blur-lg">
      <Container className="flex flex-col gap-4 py-8 text-center md:flex-row md:items-center md:justify-between md:text-start">

        <div className="flex flex-col gap-2">
          <Logo />

          <TextReveal as="p" className="max-w-sm text-xs text-muted-foreground">
            {t("description")}
          </TextReveal>
        </div>


        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground md:items-end">

          <p>
            © {currentYear} {t("copyright")}
          </p>

          <TextReveal as="p" delay={0.05}>
            {t("tagline")}
          </TextReveal>

        </div>

      </Container>
    </footer>
  )
}

export { Footer }