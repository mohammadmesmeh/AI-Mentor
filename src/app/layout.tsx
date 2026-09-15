import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans_Arabic, Rubik, Inter, IBM_Plex_Mono, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getLocale } from "next-intl/server";
import { routing } from "../i18n/routing";
import { AiCursor } from "@/shared/components/ui/AiCursor";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
})

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
})

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "AI Mentor",
  description: "AI Mentor is your personal AI mentor that builds your learning path from goals to growth.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let locale: string = routing.defaultLocale;
  try {
    const detected = await getLocale();
    if (hasLocale(routing.locales, detected)) locale = detected;
  } catch {
    // Routes outside the locale segment (e.g. the global not-found page)
    // have no locale context; fall back to the configured default.
  }
  const dir = locale === "ar" ? "rtl" : "ltr";

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("ai-mentor-theme");
  const theme = themeCookie?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${theme} ${spaceGrotesk.variable} ${ibmPlexSansArabic.variable} ${rubik.variable} ${inter.variable} ${ibmPlexMono.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AiCursor />
        {children}
      </body>
    </html>
  );
}
