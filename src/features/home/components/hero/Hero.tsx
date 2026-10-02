import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Container } from "@/shared/components/ui/Container"
import { buttonVariants } from "@/shared/components/ui/Button"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"
import { HeroBackground } from "./HeroBackground"
import { HeroMark } from "./HeroMark"
import { HeroPreview } from "./HeroPreview"

/**
 * The home hero, light in both themes (design: docs/design/hero-light).
 *
 * - The section is a `.light` area: theme colors resolve to their light values
 *   and `dark:` styles don't apply inside it, so it reads the same in dark mode.
 * - It slides up under the sticky navbar (70px, 72px from sm), so its surface
 *   runs behind the navbar as in the reference.
 * - ≥1024px: text at the start, the logo mark at the end, the preview strip
 *   rising from the bottom. 768–1023px: text, a smaller mark below it, then
 *   the strip. <768px: text and a full-width CTA, no mark, task card only.
 * - Entrance (motion-safe only): the h1 rises without fading, so it paints at
 *   once and stays the LCP element; then the text, the mark and the strip fade
 *   in, in FadeInView's timing. No continuous motion.
 */
function Hero() {
  const t = useT("hero")

  return (
    <section
      aria-labelledby="hero-heading"
      className="light relative -mt-[70px] overflow-hidden bg-linear-110 from-hero-from via-hero-via via-45% to-hero-to pt-[70px] text-ink sm:-mt-[72px] sm:pt-[72px]"
    >
      <HeroBackground />

      <Container className="relative">
        <div className="relative flex flex-col lg:min-h-[46.75rem]">
          <div className="flex flex-col gap-5.5 pt-12 sm:pt-16 lg:max-w-[min(40rem,56%)] lg:pt-31">
            <h1
              id="hero-heading"
              className="m-0! font-hero text-4xl leading-11 font-extrabold tracking-[-0.02em] text-ink motion-safe:animate-hero-rise md:text-5xl md:leading-14 rtl:text-[2.5rem] rtl:leading-[1.35] rtl:tracking-normal md:rtl:text-[3.25rem]"
            >
              {t("title")}
            </h1>

            <p className="m-0! max-w-[32.5rem] text-lg leading-7 text-on-surface-variant motion-safe:animate-hero-fade motion-safe:[animation-delay:100ms]">
              {t("description")}
            </p>

            <div className="pt-4.5 motion-safe:animate-hero-fade motion-safe:[animation-delay:200ms]">
              <Link
                href="/auth"
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "h-12 gap-3 rounded-full px-6 font-body text-[0.9375rem] font-semibold shadow-[0_10px_24px_rgb(18_49_77/25%)] transition-[translate,box-shadow,background-color] hover:scale-100 hover:-translate-y-0.5 max-sm:w-full"
                )}
              >
                {t("cta")}
                <ArrowRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <HeroMark className="mt-10 w-55 self-center max-md:hidden motion-safe:animate-hero-fade motion-safe:[animation-delay:350ms] lg:absolute lg:end-13 lg:top-67 lg:mt-0 lg:w-75 xl:w-95" />
        </div>

        <HeroPreview className="mt-12 -mb-6 motion-safe:animate-hero-fade motion-safe:[animation-delay:500ms] md:mt-14 md:-mb-10 md:h-56 lg:mx-14.5 lg:mt-0" />
      </Container>
    </section>
  )
}

export { Hero }
