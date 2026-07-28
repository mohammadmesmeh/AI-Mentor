"use client"

import { SpecularButton } from "@/shared/components/ui/SpecularButton"
import { Container } from "@/shared/components/ui/Container"
import { TextReveal } from "@/shared/components/animations/TextReveal"
import { useTranslations } from "next-intl";


export function Hero() {
    const t = useTranslations("hero");
 
    return (
        <section className="relative overflow-hidden py-14 md:py-24" aria-labelledby="hero-heading">
            <Container>
                <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                    <TextReveal as="h1" id="hero-heading" className="gradient-text text-2xl font-bold tracking-tight leading-tight sm:text-3xl md:text-4xl lg:text-5xl p-3" delay={0.1}>
                        {t("title")}
                    </TextReveal>
                    <TextReveal as="p" className="mt-0 max-w-2xl text-lg text-muted-foreground leading-tight sm:text-xl" delay={0.2}>
                        {t("description")}
                    </TextReveal>
                    <div className="mt-6">
                        <SpecularButton>

                            {t("cta")}
                        </SpecularButton>

                    </div>
                </div>
            </Container>
        </section>
    )
}
