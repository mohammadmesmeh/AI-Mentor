"use client"

import { useRef, useEffect, type CSSProperties, type ReactNode, type MouseEventHandler } from "react"
import { Renderer, Program, Mesh, Triangle, Color } from "ogl"

type ButtonSize = "sm" | "md" | "lg"

export interface SpecularButtonProps {
  children?: ReactNode
  size?: ButtonSize
  radius?: number
  tint?: string
  tintOpacity?: number
  blur?: number
  textColor?: string
  lineColor?: string
  baseColor?: string
  intensity?: number
  shineSize?: number
  shineFade?: number
  thickness?: number
  speed?: number
  followMouse?: boolean
  proximity?: number
  autoAnimate?: boolean
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  type?: "button" | "submit" | "reset"
}

interface ShaderProps {
  radius: number
  lineColor: string
  baseColor: string
  intensity: number
  shineSize: number
  shineFade: number
  thickness: number
  speed: number
  followMouse: boolean
  proximity: number
  autoAnimate: boolean
}

const PAD = 20

const SIZES: Record<ButtonSize, string> = {
  sm: "text-[0.85rem] px-[22px] py-[10px]",
  md: "text-[1rem] px-[30px] py-[14px]",
  lg: "text-[1.15rem] px-10 py-[18px]",
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`

/*
  الـ shader بيشتغل بالـ JavaScript/WebGL، فمش قادر يفهم var(--xxx) مباشرة
  زي ما بتفهمها خصائص CSS العادية — لازم قيمة hex/rgb فعلية.
  هالدالة بتفحص إذا كانت القيمة "var(--اسم-متغير)"، وإذا هيك بتقرأ
  القيمة الفعلية المحسوبة من <html> (getComputedStyle) وقت التشغيل.
  هيك لو غيّرت لون الهوية بالـ globals.css بالمستقبل، الزر بيتحدث
  تلقائيًا بدون ما ترجع تعدّل هالكومبوننت، بالظبط متل أي عنصر CSS عادي.
  ملاحظة: بتشتغل بس مع متغيرات مخزّنة كـ hex صريح (--color-primary-*,
  --color-accent-*)، مش مع متغيرات shadcn المخزّنة بصيغة oklch(...) لأن
  ogl.Color ما بتقدر تفسّرها.
*/
function resolveCssVar(value: string): string {
  if (typeof document === "undefined") return value
  const match = /var\((--[\w-]+)\)/.exec(value)
  if (!match) return value
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim()
  return resolved || value
}

function SpecularButton({
  children = "Get Started",
  size = "lg",
  radius = 18,
  // القيم دي بتُستخدم بالـ CSS العادي (inline style → color-mix)، فبتقبل
  // var() مباشرة بدون أي معالجة إضافية.
  tint = "var(--color-primary-500)",
  tintOpacity = 0,
  blur = 0,
  // نص أبيض تقريبًا مطابق لـ --text-inverse المستخدم أصلًا بـ .btn-primary
  // بالملف — نفس منطق "نص فاتح فوق تعبئة primary غامقة".
  textColor = "var(--text-inverse)",
  // lineColor/baseColor بيترسموا جوا الـ WebGL shader، فلازم قيمة hex
  // فعلية وقت التشغيل — بنستخدم resolveCssVar عشان نقدر نكتبهم كمتغيرات
  // زي باقي البروبس، وبنفس الوقت الـ shader ياخذ hex صريح.
  //
  // baseColor = primary-600: تعبئة الزر الأساسية (طبقة شفافة 0.45 alpha
  // بالـ shader) — نفس التركواز الأساسي بالهوية، بيطلع كزجاج تركوازي
  // داكن ناعم، منسجم مع glass-card بالملف.
  baseColor = "var(--color-primary-600)",
  // lineColor = accent-400: خط اللمعان المتحرك بلون الزمردي — نفس ثنائي
  // primary-400 → accent-400 المستخدم أصلًا بـ premium-card::before،
  // فالزر بيصير "بطاقة مميزة" متحركة بنفس روح باقي النظام.
  lineColor = "var(--color-accent-400)",
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
}: SpecularButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const fxRef = useRef<HTMLSpanElement>(null)
  const propsRef = useRef<ShaderProps>({} as ShaderProps)

  // resolveCssVar بينفّذ هون بس (كل render)، مش جوا الـ rAF loop تحت —
  // عشان نتفادى قراءة getComputedStyle 60 مرة بالثانية (بتعمل reflow
  // وبتأثر على الأداء). القيمة المحلولة بتنخزن بالـ ref وتستخدم كما هي
  // جوا حلقة الأنيميشن.
  useEffect(() => {
    propsRef.current = {
      radius,
      lineColor: resolveCssVar(lineColor),
      baseColor: resolveCssVar(baseColor),
      intensity,
      shineSize,
      shineFade,
      thickness,
      speed,
      followMouse,
      proximity,
      autoAnimate,
    }
  }, [
    radius,
    lineColor,
    baseColor,
    intensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse,
    proximity,
    autoAnimate,
  ])

  useEffect(() => {
    const btn = btnRef.current
    const fx = fxRef.current
    if (!btn || !fx) return

    const dpr = window.devicePixelRatio || 1
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) delete geometry.attributes.uv

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uCenter: { value: [0, 0] },
        uHalfSize: { value: [1, 1] },
        uRadius: { value: 0 },
        uAngle: { value: 2.4 },
        uPx: { value: dpr },
        uLineColor: { value: [1, 1, 1] },
        uBaseColor: { value: [0.32, 0.32, 0.32] },
        uIntensity: { value: 1 },
        uShineSize: { value: 0.17 },
        uShineFade: { value: 0.7 },
        uThickness: { value: 1 },
        uBaseWidth: { value: dpr },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })
    fx.appendChild(gl.canvas)

    const sizeRef = { w: 1, h: 1 }
    const resize = () => {
      const rect = btn.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      sizeRef.w = w
      sizeRef.h = h
      renderer.setSize(w + PAD * 2, h + PAD * 2)
      program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr]
      program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr]
    }
    const ro = new ResizeObserver(resize)
    ro.observe(btn)
    resize()

    let pointerAngle: number | null = null
    let proximityT = 0
    const onPointerMove = (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right)
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom)
      const dist = Math.hypot(dx, dy)
      if (dist === 0) {
        const nx = (e.clientX - cx) / (rect.width / 2)
        const ny = (cy - e.clientY) / (rect.height / 2)
        pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15
      } else {
        pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx)
      }
      const t = Math.max(0, 1 - dist / Math.max(propsRef.current.proximity, 1))
      proximityT = t * t * (3 - 2 * t)
    }
    window.addEventListener("pointermove", onPointerMove)

    let angle = 2.4
    let idleAngle = 2.4
    let bright = 0
    let last = performance.now()
    let raf = 0

    const lineC = new Color()
    const baseC = new Color()

    const update = (now: number) => {
      raf = requestAnimationFrame(update)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const p = propsRef.current

      idleAngle += p.speed * dt
      const target = pointerAngle != null && p.followMouse && (!p.autoAnimate || proximityT > 0)
        ? pointerAngle
        : idleAngle
      const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      angle += diff * (1 - Math.exp(-dt * 7))

      const brightTarget = p.autoAnimate ? 1 : proximityT
      bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8))

      lineC.set(p.lineColor)
      baseC.set(p.baseColor)
      program.uniforms.uAngle.value = angle
      program.uniforms.uRadius.value = Math.min(p.radius, Math.min(sizeRef.w, sizeRef.h) / 2) * dpr
      program.uniforms.uLineColor.value = [lineC.r, lineC.g, lineC.b]
      program.uniforms.uBaseColor.value = [baseC.r, baseC.g, baseC.b]
      program.uniforms.uIntensity.value = p.intensity * bright
      program.uniforms.uShineSize.value = (p.shineSize * Math.PI) / 180
      program.uniforms.uShineFade.value = (p.shineFade * Math.PI) / 180
      program.uniforms.uThickness.value = p.thickness * dpr
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      if (gl.canvas.parentNode === fx) fx.removeChild(gl.canvas)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [])

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`relative m-0 inline-flex cursor-pointer items-center justify-center border-none font-medium leading-none tracking-[0.01em] outline-none transition-transform duration-150 active:scale-[0.97] disabled:cursor-default disabled:opacity-55 disabled:active:scale-100 [color:var(--sb-text-color)] [border-radius:var(--sb-radius)] [background:color-mix(in_srgb,var(--sb-tint)_calc(var(--sb-tint-opacity)*100%),transparent)] [backdrop-filter:blur(var(--sb-blur))] focus-visible:outline-2 focus-visible:outline-offset-[3px] ${SIZES[size] || SIZES.md}${className ? ` ${className}` : ""}`}
      style={
        {
          "--sb-radius": `${radius}px`,
          "--sb-tint": tint,
          "--sb-tint-opacity": tintOpacity,
          "--sb-blur": `${blur}px`,
          "--sb-text-color": textColor,
          // بدّلنا الظل الخارجي الأسود العام بـ --shadow-ai-glow: هالة
          // تركوازية/زمردية مزدوجة الطبقة، جاهزة أصلًا بالملف، فبتربط
          // الزر بصريًا بنفس لغة "التوهج" المستخدمة بباقي الواجهة
          // (اللوقو، حالات AI-active..) بدل ظل عام مالوش علاقة بالهوية.
          // بقّينا اللمعة الداخلية الخفيفة (inset) للإحساس الزجاجي.
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), var(--shadow-ai-glow)",
        } as CSSProperties
      }
    >
      <span
        ref={fxRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-5 z-[1] [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full"
      />
      <span className="relative z-[2]">{children}</span>
    </button>
  )
}

export { SpecularButton }