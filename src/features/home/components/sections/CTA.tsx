"use client"

import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { MagneticBehavior } from "@/shared/components/animations/MagneticBehavior"
import { useTranslations } from "next-intl"
import { SpecularButton } from "@/shared/components/ui/SpecularButton"
import { useRouter } from "@/i18n/navigation"

export function CTA() {
  const t = useTranslations("cta")
  const router = useRouter()

  return (
    <section className="py-14 md:py-24" aria-labelledby="cta-heading">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <HeadingReveal as="h2" id="cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </HeadingReveal>
          <FadeInView as="p" className="mt-4 text-lg text-muted-foreground" delay={0.1}>
            {t("description")}
          </FadeInView>
          <FadeInView as="div" className="mt-8" delay={0.2}>
            <MagneticBehavior>
              <SpecularButton size="lg" onClick={() => router.push("/auth")}>
                {t("button")}
              </SpecularButton>
            </MagneticBehavior>
          </FadeInView>
        </div>
      </Container>
    </section>
  )
}