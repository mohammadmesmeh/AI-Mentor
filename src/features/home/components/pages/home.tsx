"use client"
import { Hero } from "@/features/home/components/sections/Hero"
import { Features } from "@/features/home/components/sections/Features"
import { CTA } from "@/features/home/components/sections/CTA"
import { HowItWork } from "../sections/HowItWork"

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWork />
      <Features />
      <CTA />
    </>
  )
}
