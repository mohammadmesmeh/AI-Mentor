"use client"
import { Hero } from "@/features/home/components/sections/Hero"
import { Features } from "@/features/home/components/sections/Features"
import { Pricing } from "@/features/home/components/sections/Pricing"
import { FAQ } from "@/features/home/components/sections/FAQ"
import { CTA } from "@/features/home/components/sections/CTA"
import { HowItWork } from "../sections/HowItWork"

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWork />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  )
}
