"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"

export interface AiCursorProps {
  /** حجم النقطة المركزية (px) */
  dotSize?: number
  /** حجم الحلقة في الوضع العادي (px) */
  ringSize?: number
  /** حجم الحلقة عند المرور فوق عنصر تفاعلي (px) */
  ringHoverSize?: number
  /** لون النقطة */
  dotColor?: string
  /** لون حدود الحلقة */
  ringColor?: string
  /** توهج خفيف حول النقطة، بيدي إحساس "ذكاء اصطناعي" ناعم */
  glowColor?: string
  /** سرعة تتبع النقطة (كل ما كانت أقل، كانت ألصق بالماوس) */
  dotDuration?: number
  /** سرعة تتبع الحلقة (تتأخر شوي عن النقطة، تعطي إحساس "المرونة") */
  ringDuration?: number
  zIndex?: number
  /**
   * selector للعناصر التفاعلية (أزرار، روابط...) اللي بدها تكبّر الحلقة
   * وتخفي النقطة عند المرور فوقها. مثال: "a, button, [data-cursor-hover]"
   */
  interactiveSelector?: string
}

/**
 * مؤشر صغير وأنيق: نقطة مركزية صلبة + حلقة رفيعة تتبعها بمرونة،
 * مع توهج خفيف جدًا. مصمم ليكون هادئ وواثق، يناسب واجهات AI
 * بدل مؤشرات الفقاعات الكبيرة الملفتة.
 *
 * ملاحظة: لإخفاء مؤشر النظام الافتراضي، ضيف في CSS العام:
 *   html, body, a, button { cursor: none; }
 * (يفضّل تفعيلها فقط على الشاشات اللي فيها ماوس عبر media query:
 *   @media (pointer: fine) { ... })
 */
function AiCursor({
  dotSize = 6,
  ringSize = 26,
  ringHoverSize = 42,
  dotColor = "var(--color-primary-500)",
  ringColor = "var(--color-primary-500)",
  glowColor = "rgba(30, 162, 140, 0.45)",
  dotDuration = 0.12,
  ringDuration = 0.35,
  zIndex = 9999,
  interactiveSelector = "a, button, [data-cursor-hover]",
}: AiCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const isHoveringRef = useRef(false)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // نبدأ من مركز الشاشة لتفادي "قفزة" من الزاوية عند أول تحميل
    gsap.set([dot, ring], {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    const handleMove = (e: MouseEvent) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: dotDuration, ease: "power3.out" })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: ringDuration, ease: "power2.out" })
    }

    const handleEnter = () => {
      if (isHoveringRef.current) return
      isHoveringRef.current = true
      gsap.to(ring, { width: ringHoverSize, height: ringHoverSize, opacity: 0.5, duration: 0.25, ease: "power2.out" })
      gsap.to(dot, { scale: 0, duration: 0.2, ease: "power2.out" })
    }

    const handleLeave = () => {
      isHoveringRef.current = false
      gsap.to(ring, { width: ringSize, height: ringSize, opacity: 1, duration: 0.25, ease: "power2.out" })
      gsap.to(dot, { scale: 1, duration: 0.2, ease: "power2.out" })
    }

    window.addEventListener("mousemove", handleMove)

    const targets = Array.from(document.querySelectorAll<HTMLElement>(interactiveSelector))
    targets.forEach((el) => {
      el.addEventListener("mouseenter", handleEnter)
      el.addEventListener("mouseleave", handleLeave)
    })

    return () => {
      window.removeEventListener("mousemove", handleMove)
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnter)
        el.removeEventListener("mouseleave", handleLeave)
      })
    }
  }, [dotDuration, ringDuration, ringSize, ringHoverSize, interactiveSelector])

  return (
    <div className="pointer-events-none fixed inset-0 hidden md:block" style={{ zIndex }} aria-hidden="true">
      {/* الحلقة الخارجية */}
      <div
        ref={ringRef}
        className="absolute left-0 top-0 rounded-full will-change-transform"
        style={{
          width: ringSize,
          height: ringSize,
          border: `1.5px solid ${ringColor}`,
          transition: "width 0.25s, height 0.25s",
        }}
      />
      {/* النقطة المركزية مع توهج خفيف */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 rounded-full will-change-transform"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: dotColor,
          boxShadow: `0 0 12px 2px ${glowColor}`,
        }}
      />
    </div>
  )
}

export { AiCursor }
