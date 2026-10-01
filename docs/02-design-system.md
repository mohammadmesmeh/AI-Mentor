# AI Mentor — Design System

## Status

| Area | Status |
| --- | --- |
| Design tokens (`@theme` in `src/app/globals.css`): colors, fonts, type scale, radius, shadows, easing, animation, containers, breakpoints | **Implemented** |
| Semantic theme variables (dark-first `:root`/`.dark`, `.light` override, RTL switching) | **Implemented** |
| Typography layer, RTL typography adjustments, custom utilities (`@utility`) | **Implemented** |
| Component tokens (`@layer components`): buttons, cards, inputs, badges, nav/sidebar, dialogs, progress, timeline, chat, task cards, roadmap cards, skeleton | **Implemented** |
| Accessibility baseline (focus-visible ring, WCAG AA contrast notes, reduced-motion) | **Implemented** |
| shadcn/ui primitives (`src/components/ui/`) + shared chrome (`src/shared/`) | **Implemented** |
| Radius token redundancy between `@theme` and `@theme inline` blocks | **Known ambiguity** — see "Known inconsistencies" below |

## Sources

- `src/app/globals.css` (the single source of truth; Tailwind CSS v4, CSS-first, no `tailwind.config.*`)
- `src/app/layout.tsx` (next/font loads)
- `src/components/ui/card.tsx` and other shadcn primitives
- `src/shared/components/**` (Button, Container, Logo, ThemeToggle, LanguageSwitcher, Navbar, Footer, ShellBackground, AiCursor usage)
- Docs: `specs/003-learning-dashboard/plan.md` (how the dashboard maps to these tokens)

## Fundamentals

- **CSS-first**: Tailwind v4 reads everything from `@theme`/`@theme inline`/`@utility`/`@layer components` in `globals.css`. There is no config file.
- **Dark-first**: default tokens are dark (`:root` and explicit `.dark`), set via `color-scheme: dark` even before JS runs. `.light` is an explicit opt-in class the theme toggle applies; light values override the dark defaults. The existing theme toggle persists `dark`/`light` under `localStorage["ai-mentor-theme"]`.
- **Runtime resolution**: semantic tokens are declared in `@theme inline` pointing at `var(--…)` values, so switching `.dark`/`.light` repaints immediately without rebuilding utilities.
- **Single declaration points**: breakpoints/colors/fonts/type/radius/shadow/easing/animations/containers are declared once in the main `@theme` block.

## Breakpoints

| Token | Value | Intent |
| --- | --- | --- |
| `--breakpoint-sm` | 40rem (640px) | large phones, landscape |
| `--breakpoint-md` | 48rem (768px) | tablets (portrait) |
| `--breakpoint-lg` | 64rem (1024px) | tablets (landscape), small laptops |
| `--breakpoint-xl` | 80rem (1280px) | laptops / standard desktops |
| `--breakpoint-2xl` | 96rem (1536px) | large desktops (1440p+) |
| `--breakpoint-3xl` | 120rem (1920px) | ultra-wide |

Documented responsive intent: mobile single-column `<640`; `sm` 2-column grids; `md` sidebar→icon rail; `lg` full sidebar+content+inspector; `xl` max content width; `2xl` wider gutters / 3-column dashboards; `3xl` capped and centered content.

## Color

### Primary — "Midnight Navy" (anchor `#12314D`)

Used for primary actions, links, focus, dominant brand hue.

`50 #f2f6fb · 100 #e0eaf6 · 200 #c2d5ea · 300 #97b7d8 · 400 #6694c2 · 500 #4476a9 · 600 #355e8d · 700 #2b4c74 · 800 #1a3654 · 900 #12314d · 950 #0a1d30`

### Secondary — "Azure Blue" (anchors `#DEEAFB` → `#1D4E89`)

Cool blue for chrome, secondary actions, structural surfaces.

`50 #f4f8fd · 100 #deeafb · 200 #c2d9f5 · 300 #9cc0ec · 400 #6b9fdd · 500 #4683cb · 600 #3a6fb3 · 700 #1d4e89 · 800 #1b4579 · 900 #173a66 · 950 #0d2443`

### Accent — "Vibrant Purple" (anchor `#7C3AED`)

Navy–purple signature duo; reserved for AI-glow, highlights, interactive accents, progressive UI — deliberately **not** used for primary actions.

`50 #faf5ff · 100 #f3e8ff · 200 #e9d5ff · 300 #d8b4fe · 400 #c084fc · 500 #a855f7 · 600 #9333ea · 700 #7c3aed · 800 #6d28d9 · 900 #581c87 · 950 #3b0764`

### Flat / role tokens

- `--color-midnight #0a1930` (deep hero/navy section bg) · `--color-canvas #ffffff` · `--color-alt-bg #eff4fb` (light alternating bg) ·
- `--color-light-blue-bg #deeafb` + `--color-light-blue-text #1d4e89` (light-blue callouts) · `--color-text-muted #667085` · `--color-success-green #10b981` + `--color-success-bg #d1fae5` · `--color-live-red #ef4444` · `--color-accent-purple #7c3aed`.

### Semantic scales

- **Success**: `50 #f0fbf4 · 100 #dcf5e4 · 500 #22a55e · 600 #188a4b · 900 #103b22`
- **Warning**: `50 #fffaeb · 100 #fef0c7 · 500 #f5a524 · 600 #dc8a0c · 900 #7a4a08`
- **Danger**: `50 #fef2f2 · 100 #fde3e3 · 500 #e5484d · 600 #c93a3e · 900 #5c1a1c`
- **Info**: `50 #eff8ff · 100 #dbeefe · 500 #2e90e5 · 600 #1d74c4 · 900 #0e3866`

### Semantic (theme) variables

`bg-base`, `surface`, `surface-card`, `surface-elevated`; `text-primary/secondary/muted/inverse`; `border-default/strong`. Dark values are on dark slate (`#0a0d14 → #1b2130` surfaces; `#f3f6fb/#b6bdcb/#8b93a7/#0a0d14` text; `#24272e/#34383f` borders). Light values are white/`#f6f8fc` surfaces; `#0d1b2e/#475467/#667085` text; `#e3e8f0/#c6d0de` borders. Plus glass tokens, scrollbar tokens, cursor tokens, and the full shadcn oklch palette (`background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring/chart-1..5/sidebar-*`).

## Fonts

Fonts are loaded via `next/font` in `src/app/layout.tsx`, exposed as CSS vars:

| Var | Face | Role |
| --- | --- | --- |
| `--font-space` | Space Grotesk | default body/display (LTR) |
| `--font-arabic` | IBM Plex Sans Arabic | body/display in RTL |
| `--font-rubik` | Rubik | UI font in RTL |
| `--font-inter` | Inter | UI font (LTR) |
| `--font-mon`/`--font-code` | IBM Plex Mono | code/data |
| `--font-nunito` | Nunito | `font-heading`/`font-display` map target |

Token wiring: `--font-default`/`--font-ui` swap by `dir`; `@theme inline` maps `--font-heading: var(--font-nunito)`, `--font-sans/--font-body/--font-display: var(--font-default)`, `--font-ui: var(--font-inter)`. `html[dir="rtl"]` sets `--font-default: var(--font-arabic)`, `--font-nunito: var(--font-arabic)`, `--font-ui: var(--font-rubik)` so headings/body/UI switch fonts with direction automatically.

## Type scale

| Token | Size / Line-height |
| --- | --- |
| `text-display-2xl` | 4.5rem / 1.05 |
| `text-display-xl` | 3.75rem / 1.08 |
| `text-display-lg` | 3rem / 1.1 |
| `text-heading-xl` | 2.25rem / 1.2 |
| `text-heading-lg` | 1.875rem / 1.25 |
| `text-heading-md` | 1.5rem / 1.3 |
| `text-heading-sm` | 1.25rem / 1.4 |
| `text-body-lg / md / sm` | 1.125 / 1 / 0.875rem; lh 1.6 / 1.6 / 1.55 |
| `text-caption` | 0.8125rem / 1.4 |
| `text-overline` | 0.6875rem / 1.3 |
| `text-code` | 0.875rem / 1.6 |

Tracking: `-0.03em` (display) → `0.08em` (overline). Weights: regular 400 … black 900. Base headings use `font-display`, semibold, with `--tracking-tighter`; body `p`/`li` are `text-secondary`, regular, `max-width: 72ch`.

## Radius

Declared semantically: `--radius-sm .375rem` (chips) · `--radius-md .625rem` (inputs/buttons/badges) · `--radius-lg .875rem` (cards) · `--radius-xl 1.25rem` (modals/elevated) · `--radius-2xl 1.75rem` (hero panels, premium containers) · `--radius-pill 999px`.

> The `@theme inline` block re-declares `--radius-sm..4xl` as calcs of shadcn's `--radius` (0.625rem) — see "Known inconsistencies".

## Shadows

`card` (subtle 2-layer), `dropdown`, `floating`, `hero` (deep), `ai-glow` (navy+purple halo), `focus` (3px `rgb(68 118 169 / 35%)`), `hover` (lift).

## Easing & animation

- Easing: `--ease-out-soft cubic-bezier(0.16,1,0.3,1)`, `--ease-in-out-soft cubic-bezier(0.65,0,0.35,1)`.
- Animation utilities (declared + keyframes): `animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-float`, `animate-glow-pulse` (AI-active), `animate-gradient-shift`, `animate-soft-pulse` (live/recording), `animate-typing`, `animate-shimmer` (skeleton), `animate-hover-lift`. `ambient-breathe` keyframe drives the decorative auth dot-grid. All animations are short, low-amplitude, and neutralized by the global reduced-motion rule.

## Containers

`--container-content 77.5rem` (1240px, reading/app content) · `--container-hero 63.75rem` (1020px, hero text) · `--container-wide 88rem` (1408px, dashboards/wide tables).

## Utility classes (`@utility`)

- **Typography**: `text-heading`, `text-body`, `text-label` (uppercase eyebrow — no-op in RTL), `text-button` — all dir-aware.
- **Surfaces**: `glass-card` (blur+saturate), `gradient-bg-brand` (navy→purple, hero only), `gradient-bg-subtle`, `gradient-text` (one hero headline max), `dark-section` (local midnight canvas + light text regardless of theme), `dot-grid` (decorative, reduced-motion-safe, `aria-hidden`). Scrollbars are styled globally from `--scrollbar-thumb` / `--scrollbar-thumb-hover` / `--scrollbar-track` (base layer), so no class is needed.
- **Interactive**: `focus-ring`, `btn-base`, `btn` (padding 0.625/1.125, body-sm), `hover-lift`, `badge-base`, `nav-link`, `card` (surface-card, `border-default`, `radius-lg`, `shadow-card`, 1.25rem padding), `chat-message`, `roadmap-card` (card + `border-inline-start` 3px primary).
- **Font facades**: `font-inter`, `font-space-grotesk`, `font-arabic`, `font-rubik`.

## Component tokens (`@layer components`)

- **Buttons**: `.btn-primary` (primary-800 bg / canvas text; hover primary-900), `.btn-secondary` (surface + border), `.btn-ghost`, `.btn-danger`. Base = `@apply btn` → `btn-base` + `focus-ring`.
- **Cards**: `.card-elevated` (surface-elevated + `shadow-floating`).
- **Inputs**: `.input` (surface-card, `border-default`, `radius-md`, focus-ring; hover/`border-strong`, focus `border-primary-500`).
- **Badges**: `.badge-neutral/success/warning/danger/info` (pills; dark-mode variants use translucent backgrounds + 500-scale text).
- **Navigation**: `.nav-bar` (glass-card, h-3.5rem), `.sidebar` (surface, `border-inline-end`, width 16rem), `.sidebar-item` (`nav-link` + icon gap).
- **Dialogs**: `.dialog-scrim`, `.dialog-panel` (surface-elevated, `radius-xl`, `shadow-floating`, scale-in).
- **Progress**: `.progress-track` (surface, 0.5rem, pill), `.progress-fill` (primary→accent gradient, 0.4s ease-out width).
- **Timeline**: `.timeline-item` / `.timeline-dot` (primary dot with surface-card ring) — roadmap history visuals.
- **Chat**: `.chat-message-user` (primary bg, inverse text, end-start radius), `.chat-message-assistant` (surface-card + border), `.typing-indicator` (3 staggered dots).
- **Task cards**: `.task-card` (`card` + hover-lift + row gap), `.task-card-checkbox`, `.task-card-title-done` (muted + line-through).
- **Roadmap cards**: `.roadmap-card-complete` (accent start bar), `.roadmap-card-locked` (default bar, 0.6 opacity).
- **Skeleton**: `.skeleton` (shimmer gradient via `--animate-shimmer`).

## RTL (first-class)

- Font swap (IBM Plex Sans Arabic / Rubik) via `html[dir="rtl"]`.
- Arabic typography: looser line-height scale (display 1.25–1.3, headings 1.4–1.55, body 1.65–1.8), negative tracking neutralized for headings/labels, `text-wrap: balance` on headings and `pretty` on paragraphs, word-spacing `0.06em` on type surfaces.
- Utility neutralization: all tracking and `uppercase/capitalize` disabled under RTL; `leading-*` utilities remapped to generous ratios; `reveal-mask` padded to avoid clipping Arabic ascenders/descenders in per-word reveal animations.
- Components use logical properties (`ps-/ms-/me-`, `start/end`, `inset-inline-start`) so mirrors, accent bars, and offsets flip automatically.

## Accessibility baseline

- Global focus treatment: `a/button/input/select/textarea/[tabindex]:focus-visible` → on-brand `--shadow-focus` ring; `:focus:not(:focus-visible)` gets none. Outlines are only removed for pointer users, never keyboard.
- WCAG AA pairings documented in globals.css: `text-primary` ≥12:1, `text-secondary` ≥7:1, `text-muted` ≥4.6:1 on base/surface surfaces; `text-inverse` ≥4.8:1 on primary-500/600. Re-verify when primitive values change.
- Custom cursor: `cursor: none` for `html/body/a/button/[data-cursor-hover]` on `pointer: fine` devices, backed by theme-aware cursor tokens and the shared `AiCursor` affordance. Keyboard users are unaffected (focus rings intact).
- Reduced motion: `@media (prefers-reduced-motion: reduce)` collapses all animations/transitions to 0.01ms, forces `scroll-behavior: auto`.
- `p` text is capped at 72ch; `::selection` uses primary-300/950.

## shadcn + shared chrome

- `src/components/ui/card.tsx` = `rounded-xl border bg-card text-card-foreground shadow-sm` + sub-components (Header, Title, Description, Action, Content). Other primitives follow the same shadcn v4 pattern.
- Shared chrome (`src/shared/`): `Button` (framer-motion based), `Container`, `Logo` (Brain icon, `ai-glow` + `animate-glow-pulse` orb, brand text), `ThemeToggle` (Sun/Moon crossfade with `--ease-out-soft`), `LanguageSwitcher` (pill EN/AR), `Navbar`, `Footer`, `ShellBackground` (auth gradient surface `#BFE7FC→#FFFFFF` radial + ambient decor), `AiCursor`, `providers`, `useT`, `useMobileMenu`.

## Known inconsistencies (verify)

1. **Radius double-definition**: the main `@theme` declares a semantic radius ladder (`--radius-xl 1.25rem`, `--radius-2xl 1.75rem`), while the `@theme inline` block re-declares `--radius-sm…4xl` as calcs of the shadcn `--radius` (base 0.625rem → `xl` ≈ 0.875rem, `2xl` ≈ 1.125rem). Utility resolution favors the inline calc values. The intent comments ("hero panels, premium containers" for `2xl`) do not match the effective numeric values. Decide which ladder is canonical.
2. **Font comments drift**: some globals.css comments say Nunito is "no longer loaded" while `@theme inline` maps `--font-heading`/`--font-display` to `var(--font-nunito)`, and the root layout does load Nunito. Confirm which face should drive headings.
3. **`Geist Mono` vs `IBM Plex Mono`**: §2 declares the code stack with Geist Mono first, but the loaded face is IBM Plex Mono (`--font-code`). Cosmetic; verify intended code font.
4. **`--color-text-muted` re-declared**: defined as a flat `#667085` token (§2) and again as a semantic variable (light `#667085`, dark `#8b93a7`). Features must use the semantic `text-muted`/**`--color-text-muted`** from `@theme inline`; the flat token is a fixed-value fallback.

Consumer guidance: reach for the **semantic** variables (`bg-surface-card`, `text-primary`, `border-default`, `radius-md/lg`, `shadow-card`) rather than raw palette values, mirror the existing `dashboard`/`auth` features for composition patterns, and keep visual changes inside the declared token set (per spec DR-001/DR-002).