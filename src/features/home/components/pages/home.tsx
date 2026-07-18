"use client"
import { Hero } from "@/features/home/components/sections/Hero"
import { Features } from "@/features/home/components/sections/Features"
import { CTA } from "@/features/home/components/sections/CTA"

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <CTA />
    </>
  )
}
