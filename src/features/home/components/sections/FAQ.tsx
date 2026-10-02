"use client"

import { ChevronRight } from "lucide-react"
import { useId, useState } from "react"
import { Container } from "@/shared/components/ui/Container"
import { FadeInView } from "@/shared/components/animations/FadeInView"
import { SectionHeader, sectionHighlight } from "@/shared/components/ui/SectionHeader"
import { SectionWave } from "@/shared/components/ui/SectionWave"
import { useTranslations } from "next-intl"
import { useT } from "@/shared/hooks/useT"
import { cn } from "@/lib/utils"

const faqItemKeys = [
  "multipleRoadmaps",
  "whenMultipleRoadmaps",
  "communityAvailable",
  "moreAiModels",
] as const

export function FAQ() {
  const t = useT("faq")
  const rich = useTranslations("faq")

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-section-canvas pt-20 pb-0 sm:pt-24"
      aria-labelledby="faq-heading"
    >
      <Container>
        {/* Same column as the questions below, so the header starts where they do. */}
        <SectionHeader
          className="mx-auto max-w-3xl"
          headingId="faq-heading"
          eyebrow={t("badge")}
          title={rich.rich("heading", { mark: sectionHighlight })}
          description={t("subheading")}
        />

        <FadeInView
          as="div"
          className="mx-auto mt-12 flex max-w-3xl flex-col gap-3 pb-20 sm:pb-24"
          delay={0.2}
        >
          {faqItemKeys.map((itemKey) => (
            <FaqItem
              key={itemKey}
              question={t(`items.${itemKey}.question`, itemKey)}
              answer={t(`items.${itemKey}.answer`, "")}
            />
          ))}
        </FadeInView>
      </Container>

      <SectionWave fillClassName="text-section-contrast" className="mt-16 sm:mt-20" />
    </section>
  )
}

interface FaqItemProps {
  question: string
  answer: string
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [clicked, setClicked] = useState(false)
  const [hovering, setHovering] = useState(false)
  const id = useId()
  const triggerId = `${id}-trigger`
  const contentId = `${id}-content`
  const isOpen = clicked || hovering

  return (
    <div
      className="section-card overflow-hidden rounded-2xl transition-colors duration-300 hover:bg-section-card-hover"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <h3>
        <button
          type="button"
          id={triggerId}
          onClick={() => setClicked((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-display text-base font-bold text-ink sm:px-6 sm:py-5"
        >
          <span>{question}</span>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-ink transition-transform duration-300 ease-out",
              isOpen ? "rotate-90" : "rtl:rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </h3>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-5">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}
