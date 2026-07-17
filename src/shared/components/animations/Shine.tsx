"use client"

import { motion, useAnimationControls } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ShineProps {
  children: ReactNode
  className?: string
  duration?: number
}

function Shine({
  children,
  className,
  duration = 0.6,
}: ShineProps) {
  const controls = useAnimationControls()

  const handleMouseEnter = () => {
    controls.set({ left: "-30%" })

    controls.start({
      left: "130%",
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    })
  }

  return (
    // isolate: بينشئ stacking context خاص بالكارد، عشان أي transform/
    // filter جوا children ما يأثر على كيفية قص الطبقات اللي جواته
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-xl",
        className
      )}
      onMouseEnter={handleMouseEnter}
    >
      {children}

      {/*
        طبقة قص مخصصة ولاصقة تمامًا بحدود الكارد (inset-0)، منفصلة عن
        الـ div الأب. rounded-[inherit] بتاخذ نفس قيمة الـ radius الفعلية
        المطبّقة على الأب (حتى لو className غيّرها لـ rounded-2xl مثلاً)،
        فمش لازم نكرر "rounded-xl" يدويًا هون.

        السبب الحقيقي للمشكلة: العنصر المتحرك (skew + position متحركة)
        بيترقّى لطبقة GPU منفصلة (compositing layer)، وبعض المتصفحات
        ما بتطبّق قص overflow-hidden القادم من جد بعيد (الـ parent) على
        هيك طبقة بشكل موثوق أثناء الأنيميشن. لما نحط overflow-hidden
        على أب مباشر ملاصق للعنصر نفسه (بدل ما نعتمد على الأب الأبعد
        بس)، القص بيصير مضمون 100% بكل المتصفحات.
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
        <motion.div
          className="absolute top-0 h-full w-20 skew-x-[-20deg]"
          style={{
            left: "-30%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.08) 65%, transparent)",
          }}
          animate={controls}
        />
      </div>
    </div>
  )
}

export { Shine }