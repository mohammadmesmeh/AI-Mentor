"use client"

import { SpecularButton } from "@/shared/components/ui/SpecularButton"
import { Container } from "@/shared/components/ui/Container"
import { useTranslations } from "next-intl";


export function Hero() {
    const t = useTranslations("hero");
 
    return (
        <section className="relative overflow-hidden py-14 md:py-24" aria-labelledby="hero-heading">
            <Container>
                <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                    <h1 id="hero-heading" className="gradient-text text-2xl font-bold tracking-tight leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
                        {t("title")}
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-tight sm:text-xl  ">
                        {t("description")}
                    </p>
                    <div className="mt-10">
                        <SpecularButton theme="light">

                            {t("cta")}
                        </SpecularButton>

                    </div>
                </div>
            </Container>
        </section>
    )
}
