import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { buttonVariants } from "@/shared/components/ui/Button"
import { SectionWave } from "@/shared/components/ui/SectionWave"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"
import { HeroBackground } from "./HeroBackground"
import { HeroMark } from "./HeroMark"

/**
 * The home hero (design: docs/design/hero-light).
 *
 * - Light brand surface in light mode, the same composition on deep navy in
 *   dark mode: every color is a `hero-*` theme token (globals.css).
 * - Two boxes: the content and the logo mark. Side by side from lg, the mark
 *   centered vertically against the content; stacked below that.
 * - It ends with the SectionWave every section uses.
 * - Fonts follow the rest of the site (font-display headings, the site's
 *   body and UI fonts), not the reference image's.
 * - It slides up under the sticky navbar (70px, 72px from sm), so its surface
 *   runs behind the navbar as in the reference.
 * - Entrance (motion-safe only): the h1 rises without fading, so it paints at
 *   once and stays the LCP element; then the text and the mark fade in. After
 *   that the mark and the background dots float gently up and down.
 */
function Hero() {
  const t = useT("hero")

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative -mt-[70px] overflow-hidden bg-linear-110 from-hero-from via-hero-via via-45% to-hero-to pt-[70px] sm:-mt-[72px] sm:pt-[72px]"
    >
      <HeroBackground />

      <Container className="relative text-ink">
        <div className="flex flex-col gap-10 pt-12 pb-6 sm:pt-16 lg:min-h-[40rem] lg:flex-row lg:items-center lg:gap-12 lg:py-16">
          <div className="flex flex-col gap-5.5 lg:max-w-[40rem] lg:flex-[1.2]">
            <h1
              id="hero-heading"
              className="m-0! font-display text-4xl leading-11 font-extrabold tracking-normal text-ink motion-safe:animate-hero-rise md:text-5xl md:leading-14 rtl:text-[2.5rem] rtl:leading-[1.35] md:rtl:text-[3.25rem]"
            >
              {t("title")}
            </h1>

            <p className="m-0! max-w-[32.5rem] text-lg leading-7 text-hero-text motion-safe:animate-hero-fade motion-safe:[animation-delay:100ms]">
              {t("description")}
            </p>

            <div className="pt-4.5 motion-safe:animate-hero-fade motion-safe:[animation-delay:200ms]">
              <Link
                href="/auth"
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "h-12 gap-3 rounded-full px-6 text-[0.9375rem] font-semibold shadow-[0_10px_24px_rgb(18_49_77/25%)] transition-[translate,box-shadow,background-color] hover:scale-100 hover:-translate-y-0.5 max-sm:w-full"
                )}
              >
                {t("cta")}
                <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:flex-1">
            <HeroMark className="w-40 motion-safe:animate-hero-fade motion-safe:[animation-delay:350ms] md:w-55 lg:w-75 xl:w-95" />
          </div>
        </div>
      </Container>

      <SectionWave fillClassName="text-background" className="mt-8 sm:mt-12 lg:mt-0" />
    </section>
  )
}

export { Hero }
