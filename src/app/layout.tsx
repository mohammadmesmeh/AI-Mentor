import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono, Nunito } from "next/font/google";
import localFont from "next/font/local";
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

// Arabic fonts are self-hosted (src/app/fonts, OFL-licensed) so the build
// never has to reach Google Fonts for them. Each family ships as two subset
// files — Arabic and Latin — declared separately and chained in globals.css
// (`html[dir="rtl"]`), so Latin text on Arabic pages still renders in the same
// family instead of a system font. The Arabic half disables next/font's
// metric-adjusted Arial fallback: in a chained stack that fallback would sit
// between the two halves and win every Latin glyph before the Latin file got
// a chance. The Latin halves keep the fallback (it ends the stack) and skip
// preload, matching the old setup, which only preloaded the Arabic subset.
//
// Noto Sans Arabic (variable, 100–900): body, UI, forms — everything except
// large headings.
const notoSansArabic = localFont({
  variable: "--font-noto-arabic",
  src: [{ path: "./fonts/noto-sans-arabic-variable-arabic.woff2", weight: "100 900", style: "normal" }],
  adjustFontFallback: false,
})

const notoSansArabicLatin = localFont({
  variable: "--font-noto-arabic-latin",
  src: [{ path: "./fonts/noto-sans-arabic-variable-latin.woff2", weight: "100 900", style: "normal" }],
  preload: false,
})

// Zain: large headings (h1/h2) only. Ships 200/300/400/700/800/900 — there is
// no 500 or 600, so semibold headings render at the nearest heavier weight
// (700). Only the weights the h1/h2 elements actually use are bundled.
const zain = localFont({
  variable: "--font-zain",
  src: [
    { path: "./fonts/zain-400-arabic.woff2", weight: "400", style: "normal" },
    { path: "./fonts/zain-700-arabic.woff2", weight: "700", style: "normal" },
    { path: "./fonts/zain-800-arabic.woff2", weight: "800", style: "normal" },
  ],
  adjustFontFallback: false,
})

const zainLatin = localFont({
  variable: "--font-zain-latin",
  src: [
    { path: "./fonts/zain-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/zain-700-latin.woff2", weight: "700", style: "normal" },
    { path: "./fonts/zain-800-latin.woff2", weight: "800", style: "normal" },
  ],
  preload: false,
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
  title: "Khatwa",
  description: "Khatwa is your personal AI mentor that builds your learning path from goals to growth.",
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
      className={`${theme} ${spaceGrotesk.variable} ${notoSansArabic.variable} ${notoSansArabicLatin.variable} ${zain.variable} ${zainLatin.variable} ${inter.variable} ${ibmPlexMono.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AiCursor />
        {children}
      </body>
    </html>
  );
}
