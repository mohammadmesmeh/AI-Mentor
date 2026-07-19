"use client"

import { Container } from "@/shared/components/ui/Container"

import { useTranslations } from "next-intl"
import { SpecularButton } from "@/shared/components/ui/SpecularButton"

export function CTA() {
  const t = useTranslations("cta")

  return (
    <section className="py-14 md:py-24" aria-labelledby="cta-heading">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 id="cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-8">
            <SpecularButton size="lg">
              {t("button")}
            </SpecularButton>
          </div>
        </div>
      </Container>
    </section>
  )
}
