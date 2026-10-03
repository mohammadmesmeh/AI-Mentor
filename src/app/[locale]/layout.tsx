import type { Metadata } from "next";
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import Providers from "@/shared/components/providers/providers";
import { cookies } from "next/headers";
import { THEME_COOKIE, ThemeProvider } from "@/shared/components/providers/ThemeProvider";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  // The same cookie the root layout uses for the <html> class, so the theme
  // toggle renders identically on the server and on the client.
  const theme = (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <ThemeProvider initialTheme={theme}>
      <Providers messages={messages} locale={locale}>
        {children}
      </Providers>
    </ThemeProvider>
  );
}
