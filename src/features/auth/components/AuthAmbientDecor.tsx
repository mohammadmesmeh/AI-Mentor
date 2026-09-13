"use client"

import type { CSSProperties } from "react"

interface DotGridStyle extends CSSProperties {
  "--breathe-base"?: number
}

const dotGridImage = "radial-gradient(circle, #60A5FA 1.5px, transparent 1.5px)"

function AuthAmbientDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute left-0 top-0 h-80 w-80 animate-[ambient-breathe_10s_ease-in-out_infinite] opacity-35"
        style={
          {
            "--breathe-base": 0.35,
            backgroundImage: dotGridImage,
            backgroundSize: "16px 16px",
            maskImage: "radial-gradient(circle at 0 0, black, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle at 0 0, black, transparent 70%)",
          } as DotGridStyle
        }
      />
      <div
        className="absolute bottom-0 right-0 h-96 w-96 animate-[ambient-breathe_13s_ease-in-out_infinite] opacity-40"
        style={
          {
            "--breathe-base": 0.4,
            backgroundImage: dotGridImage,
            backgroundSize: "16px 16px",
            maskImage: "radial-gradient(circle at 100% 100%, black, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle at 100% 100%, black, transparent 70%)",
          } as DotGridStyle
        }
      />
      <div className="absolute bottom-0 left-1/2 h-[340px] w-[min(1400px,100vw)] -translate-x-1/2 rounded-full bg-sky-200/50 blur-[130px]" />
    </div>
  )
}

export { AuthAmbientDecor }