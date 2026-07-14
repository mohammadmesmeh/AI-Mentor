"use client";
import { useTranslations } from "next-intl";
import { Button } from "../ui/Button";

export default function HomePage() {
    const t = useTranslations("home");
    return (
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-20 px-16 bg-white dark:bg-black sm:items-start">
            <h1>{t("welcome")}</h1>
            <Button href="/posts/post"  variant="danger" >{t("clickMe")}</Button>
        </main>
    );
}

