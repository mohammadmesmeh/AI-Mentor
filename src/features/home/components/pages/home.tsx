"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import { SpecularButton } from "@/shared/components/ui/SpecularButton";

export default function HomePage() {
    const t = useTranslations("home");
    const router = useRouter();
    return (
        <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
            
            <main className="relative z-10 flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-20 px-16 sm:items-start">
                <h1>{t("welcome")}</h1>
                <SpecularButton
                    size="lg"
                    baseColor="#4b4fe8"
                    lineColor="#ffffff"
                    textColor="#ffffff"
                    onClick={() => router.push("/posts/post")}
                >
                    {t("clickMe")}
                </SpecularButton>
            </main>
        </section>
    );
}

