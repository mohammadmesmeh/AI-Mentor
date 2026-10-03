/**
 * The hero's background art in one inline SVG: the large soft waves, the two
 * swoosh lines and the small dots, all on the visual side (the end of the
 * hero). Drawn on the reference's 1384 × 1004 board and anchored to its
 * bottom end corner, so wider or narrower screens crop the empty start side,
 * never the art.
 *
 * Mirrored as a whole in RTL, so the art sits on the left there. Below md the
 * lines, dots and the top corner wave are dropped and only the large waves
 * stay. The dots float gently up and down (motion-safe only). Decorative.
 */
function HeroBackground() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1384 1004"
      preserveAspectRatio="xMaxYMax slice"
      className="pointer-events-none absolute inset-0 size-full rtl:-scale-x-100"
    >
      <defs>
        <linearGradient id="hero-wave-a" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--color-hero-wave-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-hero-wave-2)" }} />
        </linearGradient>
        <linearGradient id="hero-wave-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-hero-wave-3)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-hero-wave-4)" }} />
        </linearGradient>
      </defs>
      <path className="max-md:hidden" d="M1050 0 C 1130 110, 1260 170, 1384 175 L 1384 0 Z" fill="url(#hero-wave-b)" />
      <path d="M560 1004 C 700 880, 840 720, 960 560 C 1060 420, 1190 300, 1384 260 L 1384 1004 Z" fill="url(#hero-wave-a)" />
      <path d="M760 1004 C 930 900, 1140 790, 1384 740 L 1384 1004 Z" className="fill-hero-wave-5" />
      <g className="max-md:hidden" fill="none">
        <path d="M590 800 C 740 712, 880 652, 1060 632 C 1210 616, 1300 568, 1384 520" className="stroke-hero-line-1" strokeWidth="2.2" />
        <path d="M640 860 C 820 760, 1020 712, 1384 640" className="stroke-hero-line-2" strokeWidth="1.6" />
      </g>
      <g className="max-md:hidden motion-safe:animate-hero-float-small">
        <circle cx="668" cy="694" r="5" className="fill-hero-dot-1" />
        <circle cx="760" cy="722" r="3.5" className="fill-hero-dot-2" />
        <circle cx="770" cy="712" r="2.5" className="fill-hero-dot-2" />
      </g>
    </svg>
  )
}

export { HeroBackground }
