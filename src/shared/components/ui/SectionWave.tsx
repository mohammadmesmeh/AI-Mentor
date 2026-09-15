import { cn } from "@/lib/utils"

interface SectionWaveProps {
  className?: string
  fillClassName?: string
  flipX?: boolean
  flipY?: boolean
}

export function SectionWave({
  className,
  fillClassName = "text-background",
  flipX = false,
  flipY = false,
}: SectionWaveProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative z-10 w-full overflow-hidden leading-none select-none -mb-[1px]",
        flipX && "-scale-x-100",
        flipY && "-scale-y-100",
        className
      )}
    >
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={cn(
          "block h-8 w-full sm:h-11 lg:h-14",
          fillClassName
        )}
      >
        <path
          d="M0,0 C280,48 560,64 840,36 C1120,8 1300,32 1440,0 L1440,80 L0,80 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

