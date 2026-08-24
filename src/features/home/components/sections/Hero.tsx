"use client"

import { SpecularButton } from "@/shared/components/ui/SpecularButton"
import { Container } from "@/shared/components/ui/Container"
import { HeadingReveal } from "@/shared/components/animations/HeadingReveal"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { ScrollStagger } from "@/shared/components/animations/ScrollStagger"
import { MagneticBehavior } from "@/shared/components/animations/MagneticBehavior"
import { Card3D } from "@/shared/components/animations/Card3D"
import { useTranslations } from "next-intl";
import { AiLearningPathCard } from "@/features/home/components/sections/AiLearningPathCard"
import { useRouter } from "@/i18n/navigation"


export function Hero() {
    const t = useTranslations("hero");
    const router = useRouter()
 
    return (
        <section className="relative overflow-hidden py-10 md:py-16" aria-labelledby="hero-heading">
            <div
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-transparent blur-[120px] opacity-60"
                aria-hidden="true"
            />
            <Container>
                <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-start max-w-xl">
                        <HeadingReveal as="h1" id="hero-heading" className=" text-2xl font-bold tracking-tight leading-tight sm:text-3xl md:text-4xl lg:text-5xl text-heading" delay={0.1}>
                            {t("title")}
                        </HeadingReveal>
                        <FadeInView as="p" className="max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg" delay={0.2}>
                            {t("description")}
                        </FadeInView>
                        <FadeInView as="div" className="mt-8" delay={0.3}>
                            <MagneticBehavior>
                                <SpecularButton onClick={() => router.push("/auth")}>
                                    {t("cta")}
                                </SpecularButton>
                            </MagneticBehavior>
                        </FadeInView>
                    </div>

                    <div className="w-full max-w-md shrink-0">
                        <ScrollStagger delay={0.2}>
                            <Card3D>
                                <AiLearningPathCard />
                            </Card3D>
                        </ScrollStagger>
                    </div>
                </div>
            </Container>
        </section>
    )
}