"use client"

import { SpecularButton } from "@/shared/components/ui/SpecularButton"
import { Container } from "@/shared/components/ui/Container"
import { TextReveal } from "@/shared/components/animations/TextReveal"
import { useTranslations } from "next-intl";
import { AiLearningPathCard } from "@/features/home/components/sections/AiLearningPathCard"


export function Hero() {
    const t = useTranslations("hero");
 
    return (
        <section className="relative overflow-hidden py-10 md:py-16" aria-labelledby="hero-heading">
            <div
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-transparent blur-[120px] opacity-60"
                aria-hidden="true"
            />
            <Container>
                <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-start max-w-xl">
                        <TextReveal as="h1" id="hero-heading" className="gradient-text text-2xl font-bold tracking-tight leading-tight sm:text-3xl md:text-4xl lg:text-5xl mb-3" delay={0.1}>
                            {t("title")}
                        </TextReveal>
                        <TextReveal as="p" className="max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg" delay={0.2}>
                            {t("description")}
                        </TextReveal>
                        <TextReveal as="div" className="mt-8" delay={0.3}>
                            <SpecularButton>
                                {t("cta")}
                            </SpecularButton>
                        </TextReveal>
                    </div>

                    <div className="w-full max-w-md shrink-0">
                        <AiLearningPathCard />
                    </div>
                </div>
            </Container>
        </section>
    )
}