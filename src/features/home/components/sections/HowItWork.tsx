"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useT } from "@/shared/hooks/useT";
import { Container } from "@/shared/components/ui/Container";
import { TextReveal } from "@/shared/components/animations/TextReveal";
import { StepCard } from "@/shared/components/ui/StepCard";

export const HowItWork = () => {
    const t = useT("howItWork")
    const steps = [
        {
            number: "01",
            title: t("step1.title", "Tell us your goal"),
            description: t("step1.description", "Share what you want to learn, your current level, and the time you have available."),
        },
        {
            number: "02",
            title: t("step2.title", "Get a structured roadmap"),
            description: t("step2.description", "Your AI mentor builds staged milestones matched to your goals and desired outcome."),
        },
        {
            number: "03",
            title: t("step3.title", "Do one task at a time"),
            description: t("step3.description", "Follow clear instructions and curated resources without getting lost across multiple tabs."),
        },
        {
            number: "04",
            title: t("step4.title", "Check in with your mentor"),
            description: t("step4.description", "Ask questions in context — your mentor already understands where you are."),
        },
    ];

    const timelineRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: timelineRef,
        offset: ["start center", "end center"],
    })
    const progress = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        restDelta: 0.001,
    })

    const [activeIndex, setActiveIndex] = useState(0)
    const [progressValue, setProgressValue] = useState(0)

    useMotionValueEvent(scrollYProgress, "change", (value) => {
        const index = Math.min(
            steps.length - 1,
            Math.max(0, Math.floor(value * steps.length))
        )
        setActiveIndex(index)
    })
    useMotionValueEvent(progress, "change", (value) => {
        setProgressValue(value)
    })

    const fillFor = (index: number) => {
        if (steps.length <= 1) return progressValue >= 1 ? 1 : 0
        const segStart = index / steps.length
        const segEnd = (index + 1) / steps.length
        return Math.min(1, Math.max(0, (progressValue - segStart) / (segEnd - segStart)))
    }

    return (
        <section
            className="relative overflow-hidden py-10 md:py-16"
            aria-labelledby="how-it-works-heading"
        >
            {/* Background glow */}
            <div
                className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-transparent blur-[120px] opacity-60"
                aria-hidden="true"
            />

            <Container>
                {/* Heading */}
                <div className="mx-auto max-w-3xl text-center">
                    <TextReveal
                        as="h2"
                        id="how-it-works-heading"
                        className="text-3xl font-bold tracking-tight sm:text-4xl"
                    >
                        {t("title", "How It Works")}
                    </TextReveal>

                    <TextReveal
                        as="p"
                        className="mt-4 text-muted-foreground"
                    >
                        {t("subtitle", "Four steps from a vague goal to daily momentum.")}
                    </TextReveal>
                </div>

                {/* Timeline */}
                <div ref={timelineRef} className="mx-auto mt-16 max-w-3xl">
                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <StepCard
                                key={step.number}
                                {...step}
                                active={index === activeIndex}
                                connector={index < steps.length - 1}
                                fill={fillFor(index)}
                            />
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
};  