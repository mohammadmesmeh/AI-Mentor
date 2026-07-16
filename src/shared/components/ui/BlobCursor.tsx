"use client"

import { useRef, useEffect, useCallback } from "react"
import gsap from "gsap"

export interface BlobCursorProps {
  blobType?: "circle" | "square"
  fillColor?: string
  trailCount?: number
  sizes?: number[]
  innerSizes?: number[]
  innerColor?: string
  opacities?: number[]
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  filterId?: string
  filterStdDeviation?: number
  filterColorMatrixValues?: string
  useFilter?: boolean
  fastDuration?: number
  slowDuration?: number
  fastEase?: string
  slowEase?: string
  zIndex?: number
}

function BlobCursor({
  blobType = "circle",
  // كان #5227FF (بنفسجي جامد) — بدلناه بمتغير الهوية الأساسي (Calm Teal)
  // من globals.css، فيتماشى تلقائيًا مع أي تعديل مستقبلي على البراند
  // بدون ما نرجع نلمس هالملف.
  fillColor = "var(--color-primary-500)",
  trailCount = 3,
  sizes = [60, 125, 75],
  innerSizes = [20, 35, 25],
  // لمسة تركوازية فاتحة جدًا بدل أبيض خام 100%، بتدي إحساس أدفأ
  // وأكثر انسجام مع باقي الواجهة بدل ما يبين كبقعة بيضاء منفصلة.
  innerColor = "var(--color-primary-50)",
  // خفّفنا الشفافية شوي (0.6 → مدرّجة 0.5/0.42/0.36) عشان الذيل
  // (trail) يخف تدريجيًا بشكل أنعم بدل ما يكون بنفس الكثافة بكل الحلقات،
  // وهاد إحساس أهدأ وأقل "إزعاجًا" للعين أثناء الحركة.
  opacities = [0.5, 0.42, 0.36],
  // بدل ظل أسود قاسي بإزاحة قطرية (10px, 10px) — استبدلناه بتوهج ناعم
  // ومتمركز (offset صفر) بلون العلامة نفسه، بنفس روح --shadow-ai-glow
  // من globals.css. هيك البلوب يبين كـ "توهج" احترافي عصري، مش كظل
  // ورقة قديم الطراز.
  shadowColor = "rgba(30, 162, 140, 0.35)",
  shadowBlur = 28,
  shadowOffsetX = 0,
  shadowOffsetY = 0,
  filterId = "blob",
  // خفّفنا الـ blur قليلًا (30 → 22) وضبطنا معامل الدمج (35 -10 → 22 -9)
  // عشان الحواف تضل أنعم وتلتحم بشكل جميل بدون ما تفقد شكل الدائرة
  // نهائيًا وتصير "بقعة" غير واضحة — توازن بين النعومة والوضوح.
  filterStdDeviation = 22,
  filterColorMatrixValues = "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9",
  useFilter = true,
  fastDuration = 0.15,
  // زودنا شوي (0.5 → 0.6) عشان الحلقة البطيئة تلحق بانسيابية أهدأ،
  // إحساس "متابعة ناعمة" بدل ما تلحق بسرعة وتحس إنها عصبية.
  slowDuration = 0.6,
  fastEase = "power3.out",
  // power2.out بدل power1.out: تباطؤ أكثر انضباطًا في النهاية، بيحس
  // المستخدم إن الحركة "تستقر" بلطف بدل ما تفضل تتراخى ببطء.
  slowEase = "power2.out",
  zIndex = 0,
}: BlobCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const blobsRef = useRef<(HTMLDivElement | null)[]>([])

  const getOffset = useCallback(() => {
    if (!containerRef.current) return { left: 0, top: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return { left: rect.left, top: rect.top }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container?.parentElement) return

    const parent = container.parentElement

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const { left, top } = getOffset()
      const x = "clientX" in e ? e.clientX : e.touches[0].clientX
      const y = "clientY" in e ? e.clientY : e.touches[0].clientY

      blobsRef.current.forEach((el, i) => {
        if (!el) return
        gsap.to(el, {
          x: x - left,
          y: y - top,
          duration: i === 0 ? fastDuration : slowDuration,
          ease: i === 0 ? fastEase : slowEase,
        })
      })
    }

    const handleResize = () => getOffset()

    parent.addEventListener("mousemove", handleMove)
    parent.addEventListener("touchmove", handleMove, { passive: true })
    window.addEventListener("resize", handleResize)

    return () => {
      parent.removeEventListener("mousemove", handleMove)
      parent.removeEventListener("touchmove", handleMove)
      window.removeEventListener("resize", handleResize)
    }
  }, [getOffset, fastDuration, slowDuration, fastEase, slowEase])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex }}
      aria-hidden="true"
    >
      {useFilter && (
        <svg className="absolute size-0" aria-hidden="true">
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={filterStdDeviation} />
            <feColorMatrix in="blur" values={filterColorMatrixValues} />
          </filter>
        </svg>
      )}

      <div
        className="pointer-events-none absolute inset-0 select-none"
        style={{ filter: useFilter ? `url(#${filterId})` : undefined }}
      >
        {Array.from({ length: trailCount }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              blobsRef.current[i] = el
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={{
              width: sizes[i] ?? sizes[sizes.length - 1] ?? 60,
              height: sizes[i] ?? sizes[sizes.length - 1] ?? 60,
              borderRadius: blobType === "circle" ? "50%" : 0,
              backgroundColor: fillColor,
              opacity: opacities[i] ?? opacities[opacities.length - 1] ?? 0.6,
              boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`,
            }}
          >
            {i < innerSizes.length && (
              <div
                className="absolute"
                style={{
                  width: innerSizes[i],
                  height: innerSizes[i],
                  top: (sizes[i] - innerSizes[i]) / 2,
                  left: (sizes[i] - innerSizes[i]) / 2,
                  backgroundColor: innerColor,
                  borderRadius: blobType === "circle" ? "50%" : 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export { BlobCursor }