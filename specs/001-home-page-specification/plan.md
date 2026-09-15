# Implementation Plan: Home Page — Adaptive Intelligence Redesign

**Branch**: `001-home-page-specification` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-home-page-specification/spec.md`

## Summary

Redesign the Home Page of the AI Mentor frontend to match the approved Prototype Specification's visual design, layout patterns, responsive behavior, and interaction patterns. The existing 7-section scope is preserved (Visual System, Header, Hero, How It Works, Features, CTA, Footer). The prototype serves as a visual/UX reference only — not a source of truth for production feature scope.

Key visual changes: dark navy Hero/CTA/Footer bookends, asymmetric bento grid for How It Works, masonry layout for Features, Nunito font for headings, navy/blue/purple color system as the new primary visual system — replacing the existing teal/emerald tokens as the project default wherever they are no longer required.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Tailwind CSS v4 (CSS-first config in globals.css), Framer Motion 12, next-intl 4, shadcn/ui, Lucide React, class-variance-authority, clsx, tailwind-merge

**Storage**: N/A (static marketing page, no data persistence)

**Testing**: Manual visual review + build validation (no test framework configured for component tests)

**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge), responsive mobile/tablet/desktop

**Project Type**: Web application (Next.js App Router, single-page marketing landing page)

**Performance Goals**: Static rendering where possible, minimal client-side JS, GPU-accelerated animations only

**Constraints**: Established architecture and file organization preserved. The new Global Visual System (navy/blue/purple tokens, Nunito font, 1240px container) becomes the project's primary system. Old teal/emerald tokens and old container width are removed or repurposed where they are no longer required — any removal must be audited for cross-page impact and flagged as an Engineering Warning. No new major dependencies. RTL/LTR parity maintained. Dark/light theme compatibility maintained.

**Scale/Scope**: 7 independently implementable sections, 1 global CSS update, ~15 files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security, Privacy, Data Ownership | PASS | No user data, no API calls, no auth changes |
| II. Separation of Responsibilities | PASS | UI-only changes, no business logic, no backend |
| III. Data Integrity | PASS | No data persistence, no state mutations |
| IV. Responsible AI Behavior | PASS | No AI integrations in scope |
| V. Abstraction & Provider Replaceability | PASS | No provider changes |
| VI. Reliability & Failure Handling | PASS | Static page, no external dependencies |
| VII. Safe State Changes | PASS | No state-changing operations |
| VIII. Internationalization, Responsiveness, Inclusive UX | PASS | RTL/LTR preserved, responsive breakpoints defined, accessibility specified |
| IX. Maintainability & Observability | PASS | Reuses existing patterns, no unnecessary abstractions |
| X. Explicit Scope & Controlled Changes | CONDITIONAL | Global visual system change affects all pages — cross-page impact audit required during Unit 1 implementation. Flagged in Complexity Tracking. |

**Technical Constraints Check**:
- Next.js App Router: PASS (existing routing preserved)
- shadcn/ui + Tailwind CSS: PASS (existing primitives reused)
- next-intl: PASS (translation keys added to existing files)
- No new npm dependencies: PASS (Nunito added via `next/font/google` — bundled font, not a new package)
- No backend changes: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-home-page-specification/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — no data model for static page)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no external interfaces)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css                          # REWRITE: navy/blue/purple tokens, Nunito font, 1240px container, remove old teal tokens
│   ├── layout.tsx                           # MODIFY: add Nunito font import, update font variables
│   └── [locale]/
│       └── (main)/
│           ├── layout.tsx                   # NO CHANGE (Navbar + Footer wrapping)
│           └── page.tsx                     # NO CHANGE (renders HomePage)
├── features/
│   └── home/
│       └── components/
│           ├── pages/
│           │   └── home.tsx                 # NO CHANGE (composes sections)
│           └── sections/
│               ├── Hero.tsx                 # REWRITE: dark navy bg, dot grid, dual CTAs
│               ├── HowItWork.tsx            # REWRITE: bento grid layout
│               ├── Features.tsx             # REWRITE: masonry layout, 4 cards
│               ├── CTA.tsx                  # REWRITE: dark navy bg, centered layout
│               └── AiLearningPathCard.tsx   # REMOVE or DEFER (not in production scope)
├── shared/
│   └── components/
│       ├── layout/
│       │   ├── navbar/
│       │   │   └── Navbar.tsx               # MODIFY: glass morphism, responsive nav links
│       │   └── Footer.tsx                   # REWRITE: dark bg, horizontal layout with links
│       ├── ui/
│       │   ├── Button.tsx                   # NO CHANGE (reuse existing)
│       │   ├── Container.tsx                # NO CHANGE (reuse existing)
│       │   ├── FeatureCard.tsx              # MODIFY: adapt for masonry layout
│       │   └── StepCard.tsx                 # MODIFY: adapt for bento grid
│       └── animations/
│           ├── HeadingReveal.tsx            # NO CHANGE (reuse existing)
│           ├── FadeInView.tsx               # NO CHANGE (reuse existing)
│           └── ... (other animations)       # NO CHANGE (reuse existing)
├── components/
│   └── ui/
│       └── card.tsx                         # NO CHANGE (shadcn primitive)
└── messages/
    ├── en.json                              # MODIFY: add/update translation keys
    └── ar.json                              # MODIFY: add/update translation keys
```

**Structure Decision**: Next.js App Router with feature-based organization. Home page sections live under `src/features/home/components/sections/`. Shared components (Navbar, Footer, UI primitives) live under `src/shared/components/`. All configuration in `src/app/globals.css` (Tailwind v4 CSS-first).

## Implementation Units

The plan is divided into 7 independently reviewable implementation units, each producing a deliverable that can be reviewed and tested before proceeding.

---

### Unit 1: Global CSS / Visual System

**Goal**: Establish the new primary visual system for the entire project — Nunito font for headings, navy/blue/purple color palette as the default, 1240px container width, and dark-section utilities. Old teal/emerald tokens and old 1152px container width are removed or repurposed where no longer required.

**Files to modify**:
- `src/app/layout.tsx` — add Nunito font import via `next/font/google`, update `--font-display` variable
- `src/app/globals.css` — REWRITE the visual token foundation: replace teal primitives with navy/blue/purple, replace old container width, replace old font display token, add dark-section utility, remove unused old tokens

**Existing components/files to reuse**:
- Existing `@theme` block structure (rewritten with new tokens)
- Existing `@utility` block structure
- Existing `@layer components` structure
- Existing `[dir="rtl"]` override pattern for RTL typography

**Scope of changes**:
1. Add Nunito font import in `layout.tsx` (weights: 600, 700, 800, 900)
2. Update CSS variables in `layout.tsx`: `--font-display` → Nunito (LTR), IBM Plex Sans Arabic (RTL)
3. **Replace** primitive color tokens in `@theme`:
   - Remove `--color-primary-*` (teal #1ea28c scale) → replace with `--color-primary-*` (navy #12314D scale)
   - Remove `--color-secondary-*` (slate mist #64827e scale) → replace with `--color-secondary-*` (blue #1D4E89 / #DEEAFB scale)
   - Remove `--color-accent-*` (emerald #22ad84 scale) → replace with `--color-accent-*` (purple #7C3AED scale)
   - Add `--color-midnight` (#0A1930) for dark section backgrounds
   - Add `--color-canvas` (#FFFFFF) for light section backgrounds
   - Add `--color-alt-bg` (#EFF4FB) for alternating section backgrounds
   - Add `--color-text-muted` (#667085)
   - Add `--color-success-green` (#10B981), `--color-success-bg` (#D1FAE5)
   - Add `--color-live-red` (#EF4444)
4. **Replace** semantic theme variables:
   - Update `--text-primary`, `--text-secondary`, `--text-muted` to match new palette
   - Update `--bg-base`, `--surface`, `--surface-card` to match new palette
   - Update `--glass-bg`, `--glass-border` for glass morphism
   - Update shadcn oklch vars (`--primary`, `--secondary`, `--accent`, `--ring`) to match new palette
5. **Replace** `--container-content` from 72rem (1152px) to 77.5rem (1240px)
6. Add `--container-hero` (63.75rem / 1020px) for hero text max-width
7. Add `.dark-section` utility class for Hero/CTA/Footer dark backgrounds (midnight-navy bg, white text)
8. Add dot-grid background pattern utility
9. **Remove** old teal-specific tokens that are no longer used (after cross-page audit)
10. **Remove** old emerald accent tokens that are no longer used
11. Update component classes (`.btn-primary`, `.badge-*`, `.card`, etc.) to use new navy/blue palette
12. Update `SpecularButton` theme colors reference if needed (check `THEME_COLORS` in component)
13. Verify all `[dir="rtl"]` overrides work with new tokens

**Cross-page audit required before removal**:
- Scan all components under `src/features/dashboard/`, `src/features/onboarding/`, `src/features/auth/` for usage of old teal tokens (`bg-primary`, `text-primary`, `border-primary`, `--color-primary-*`)
- If any page uses old tokens directly via Tailwind utilities, those utilities will now map to navy — verify this is acceptable or migrate those references
- If critical, keep a `--color-teal-*` alias set temporarily and remove in a follow-up task

**Visual requirements from spec** (new primary system):
- Primary navy: #12314D (buttons, headings, active states)
- Midnight navy: #0A1930 (dark backgrounds: hero, footer, CTA, sandbox)
- Light blue bg: #DEEAFB (badges, borders, progress bar tracks)
- Light blue text: #1D4E89 (secondary buttons, informative text)
- Canvas: #FFFFFF (page background, light card surfaces)
- Alt-bg: #EFF4FB (section alternation, secondary surfaces)
- Text-muted: #667085 (secondary text, descriptions)
- Success green: #10B981 (completed states, positive metrics)
- Accent purple: #7C3AED (active AI states only)
- Live red: #EF4444 (live indicator dots)
- Nunito for headings (extrabold 900, bold 700, semibold 600)
- Space Grotesk for body/UI/labels
- JetBrains Mono for code
- Container max-width: 1240px (sections), 1020px (hero text)

**RTL/LTR considerations**:
- Nunito does not support Arabic — IBM Plex Sans Arabic remains the Arabic heading font
- `[dir="rtl"]` override must point `--font-display` to Arabic font
- All new color tokens must work in both LTR and RTL
- Verify `[dir="rtl"]` typography overrides (line-height, letter-spacing, word-spacing) still function

**Animation requirements**:
- CSS-only: add `@keyframes marquee` for potential future use
- CSS-only: add `@keyframes fadeIn` for modal transitions
- No global animation system changes

**Accessibility requirements**:
- All new color token combinations must meet WCAG AA contrast
- Focus ring tokens must work against both light and dark surfaces
- `.dark-section` utility must ensure sufficient contrast for white text on midnight-navy

**Dependencies on previously completed units**: None (this is the foundation)

**Acceptance criteria**:
- [ ] Nunito font loads correctly in LTR (inspect heading elements → computed font-family includes "Nunito")
- [ ] IBM Plex Sans Arabic loads correctly in RTL for headings
- [ ] Navy/blue/purple tokens are the primary Tailwind utilities
- [ ] Old teal tokens are removed or no longer referenced (verify with grep)
- [ ] Container width is 1240px on desktop
- [ ] `.dark-section` utility produces midnight-navy background with white text
- [ ] All shadcn component classes use new palette (buttons, badges, cards, inputs)
- [ ] Build passes without errors
- [ ] Cross-page audit completed: no broken pages
- [ ] RTL mode works correctly with new tokens

**Validation steps**:
1. Run `pnpm build` — must pass with no errors
2. Run `pnpm dev` — verify homepage loads with new tokens
3. `grep -r "color-primary" src/` — verify no old teal hex values remain in components
4. Inspect computed styles: navy colors applied to headings and buttons
5. Inspect computed styles: Nunito applied to headings in LTR
6. Inspect computed styles: Arabic font applied to headings in RTL
7. Navigate to dashboard, onboarding, auth pages — verify no visual breakage
8. Verify `.dark-section` produces correct dark background
9. Verify container width is 1240px (inspect computed max-width)

**Engineering Notes / Warnings**:
- **BREAKING CHANGE**: Replacing primary color tokens from teal to navy will affect ALL components that use `bg-primary`, `text-primary`, `border-primary`, etc. — this includes dashboard, onboarding, and auth pages. Cross-page visual audit is mandatory before merging.
- **Font change**: `--font-display` changing from Space Grotesk to Nunito affects all heading elements project-wide. If this causes unacceptable visual regression on other pages, create a separate `--font-heading` token and use it explicitly in Home Page sections only.
- **Container width**: Changing from 1152px to 1240px affects all pages using `Container` with `max-w-(--container-content)`. Verify no layout overflow on dashboard/onboarding/auth.
- **SpecularButton**: The `THEME_COLORS` object in `SpecularButton.tsx` hardcodes hex copies of old primary colors. Must be updated to match new navy palette, or the WebGL shader button will render with wrong colors.
- **ThemeToggle / ThemeProvider**: The existing dark/light theme system may conflict with the new palette. The new palette is designed for light mode as primary. Verify ThemeProvider's `.dark`/`.light` class behavior is compatible.
- **Old teal fallback**: If cross-page audit reveals critical breakage, add `--color-teal-*` alias tokens temporarily and remove in a follow-up task after migrating affected pages.

---

### Unit 2: Header (Navbar)

**Goal**: Update the existing Navbar with glass morphism styling, responsive navigation links matching the prototype's visual pattern, and mobile hamburger menu.

**Files to modify**:
- `src/shared/components/layout/navbar/Navbar.tsx` — restyle with glass morphism, update layout
- `src/shared/components/layout/navbar/NavLinks.tsx` — update link items and styling
- `src/shared/components/layout/navbar/MobileMenuButton.tsx` — verify responsive behavior
- `messages/en.json` — update nav translation keys
- `messages/ar.json` — update nav translation keys

**Existing components/files to reuse**:
- `Logo.tsx` (existing brand logo component)
- `NavLinks.tsx` (existing nav links with pill styling)
- `MobileMenuButton.tsx` (existing hamburger toggle)
- `LanguageSwitcher.tsx` (existing locale toggle)
- `Container.tsx` (section container)
- `useT()` hook (existing i18n wrapper)
- `useMobileMenu.ts` (existing mobile menu state hook)

**Scope of changes**:
1. Restyle Navbar container: fixed top, centered, rounded pill shape, glass morphism (bg-white/40 backdrop-blur-xl, border #DEEAFB/50)
2. Update shadow: `0 8px 32px -8px rgba(18,49,77,0.15)`
3. Update nav links: Features, How It Works, Curriculum, Pricing (matching prototype — but keeping production link targets)
4. Update CTAs: "Sign In" button + "Start Learning" primary CTA (or keep existing "Get Started")
5. Mobile: hamburger menu with dropdown overlay, condensed "Start" button
6. Smooth scroll to anchor sections on link click
7. Max-width 1240px centered

**Visual requirements from spec**:
- Glass morphism: bg-white/40, backdrop-blur-xl, border #DEEAFB/50
- Shadow: `0 8px 32px -8px rgba(18,49,77,0.15)`
- Brand: terminal icon in navy square + "AI Mentor" text (Nunito extrabold)
- Nav links: hidden on mobile, visible on tablet+
- CTAs: Sign In (ghost/secondary) + Start Learning (primary navy)
- Mobile: hamburger → dropdown overlay

**Responsive behavior**:
- Mobile (< 640px): Hamburger menu, condensed "Start" button, dropdown overlay
- Tablet (640px–1023px): Full nav links visible, Sign In + Start Learning
- Desktop (>= 1024px): Full layout with max-width 1240px

**RTL/LTR considerations**:
- Navigation links mirror position in RTL
- Hamburger menu animation direction reverses
- Logo moves to right in RTL

**Interaction behavior**:
- Smooth scroll to anchor sections on link click
- Mobile menu toggle opens/closes dropdown
- Escape key closes mobile menu
- Focus trap within mobile menu when open

**Animation requirements**:
- Mobile menu: slide-down animation (existing pattern)
- Hover transitions: 300ms ease-in-out

**Accessibility requirements**:
- `<header>` landmark element
- Navigation wrapped in `<nav>` with `aria-label="Main navigation"`
- Mobile toggle has `aria-label` ("Open menu" / "Close menu")
- Mobile drawer has `aria-expanded`
- Focus trap within mobile drawer
- Skip navigation link as first focusable element

**Dependencies on previously completed units**: Unit 1 (color tokens, font)

**Acceptance criteria**:
- [ ] Navbar is fixed at top with glass morphism effect
- [ ] Nav links are visible on tablet/desktop, hidden on mobile
- [ ] Mobile hamburger opens/closes dropdown menu
- [ ] Smooth scroll works for anchor links
- [ ] RTL layout mirrors correctly
- [ ] Focus trap works in mobile menu
- [ ] Build passes

**Validation steps**:
1. Run `pnpm build` — must pass
2. Run `pnpm dev` — verify navbar renders correctly
3. Test at 375px (mobile): hamburger visible, dropdown works
4. Test at 768px (tablet): full nav visible
5. Test at 1280px (desktop): full layout with 1240px max-width
6. Switch to Arabic: verify RTL mirror
7. Tab through all interactive elements: verify focus indicators

---

### Unit 3: Hero

**Goal**: Rewrite the Hero section to match the Prototype Specification's dark navy hero with dual CTAs.

**Files to modify**:
- `src/features/home/components/sections/Hero.tsx` — complete rewrite
- `messages/en.json` — update hero translation keys
- `messages/ar.json` — update hero translation keys

**Existing components/files to reuse**:
- `Container.tsx` (section container)
- `Button.tsx` or `SpecularButton.tsx` (CTA buttons)
- `HeadingReveal.tsx` (heading animation)
- `FadeInView.tsx` (subtitle animation)
- `useT()` hook (i18n)
- Existing `glass-card` utility (for CTA button secondary variant)

**Scope of changes**:
1. Replace current two-column layout (text + AI Learning Path Card) with centered single-column dark hero
2. Background: midnight-navy (#0A1930) with dot grid pattern overlay
3. Ambient blur glow (decorative, low opacity) behind content
4. Headline: "Your Dynamic AI Career Roadmap, Synthesized in Real Time" (Nunito extrabold, up to 56px, white)
5. Subtitle: descriptive paragraph (Space Grotesk, slate/light gray on dark bg)
6. Dual CTAs: "Generate Free Roadmap" (primary navy, rounded-full) + "Explore Curriculums" (light blue bg, rounded-full)
7. Remove: Badge, Trust line, AI Learning Path Card (per clarification)
8. CTA behavior: "Generate Free Roadmap" → placeholder (scroll to How It Works), "Explore Curriculums" → scroll to #how-it-works

**Visual requirements from spec**:
- Dark midnight-navy (#0A1930) background
- Dot grid pattern overlay (CSS background pattern)
- Ambient blur glow (decorative)
- Centered text, max-width 1020px
- Headline: Nunito extrabold, white, up to 56px
- Subtitle: Space Grotesk, muted on dark bg
- Primary CTA: bg-primary-navy, white text, rounded-full, shadow-md
- Secondary CTA: bg-light-blue-bg, blue text, rounded-full
- Section padding: py-24, px-6

**Responsive behavior**:
- Mobile (< 640px): pt-36, pb-20, text-4xl, CTAs stack or full-width
- Tablet (640px–1023px): text-5xl, CTAs side-by-side
- Desktop (>= 1024px): text-[56px], max-width 1020px

**RTL/LTR considerations**:
- Text alignment mirrors to right in RTL
- CTAs maintain position (centered)

**Interaction behavior**:
- CTA buttons have hover lift (-translate-y-0.5, shadow-lg)
- CTA buttons have active snap-back (translate-y-0)
- Keyboard users can reach and activate both CTAs

**Animation requirements**:
- HeadingReveal for headline (existing)
- FadeInView for subtitle (existing)
- Button hover transitions (existing)
- Decorative: floating/ambient animation on blur glow (CSS, respects prefers-reduced-motion)

**Accessibility requirements**:
- `<section>` with `aria-labelledby` pointing to h1
- h1 with unique ID
- Decorative dot grid and blur glow marked `aria-hidden="true"`
- Both CTAs have descriptive accessible names
- Reduced motion: ambient animations disabled

**Dependencies on previously completed units**: Unit 1 (tokens, font, dark-section utility)

**Acceptance criteria**:
- [ ] Dark navy background with dot grid pattern
- [ ] Headline renders in Nunito, white, correct size
- [ ] Both CTAs visible and functional
- [ ] Hover effects work on CTAs
- [ ] Responsive layout correct at all breakpoints
- [ ] RTL text alignment mirrors
- [ ] Build passes

**Validation steps**:
1. Run `pnpm build` — must pass
2. Run `pnpm dev` — verify hero renders correctly
3. Visual comparison with prototype at 1280px, 768px, 375px
4. Click CTAs — verify scroll behavior
5. Switch to Arabic — verify RTL
6. Enable prefers-reduced-motion — verify animations disabled

---

### Unit 4: How It Works

**Goal**: Rewrite the How It Works section with asymmetric bento grid layout matching the prototype's visual design.

**Files to modify**:
- `src/features/home/components/sections/HowItWork.tsx` — complete rewrite
- `src/shared/components/ui/StepCard.tsx` — adapt for bento grid (if needed)
- `messages/en.json` — update howItWork translation keys
- `messages/ar.json` — update howItWork translation keys

**Existing components/files to reuse**:
- `Container.tsx` (section container)
- `StepCard.tsx` (step card — adapt for bento layout)
- `HeadingReveal.tsx` (heading animation)
- `FadeInView.tsx` (card entrance animation)
- `useT()` hook (i18n)
- Existing `glass-card` utility
- Existing `hover-lift` utility

**Scope of changes**:
1. Replace vertical timeline with asymmetric bento grid (CSS Grid)
2. Section badge: "Precision Learning Pipeline" (pill)
3. Heading: "Bento Learning Architecture" (h2, Nunito extrabold)
4. Subtitle: describes 4-phase curriculum engine
5. 4 step cards in bento layout:
   - Step #01 (2col x 2row): "Diagnostic Profile Sync"
   - Step #02 (1col): "Real-time Curriculum Synthesis"
   - Step #03 (1col): "Sandbox Proof & Calibration"
   - Step #04 (2col): "Dynamic Milestone Refactoring"
6. Each card: step number watermark, icon in navy square, title, description
7. Hover effects: -translate-y-1, bg-white/75, shadow-xl
8. Remove: scroll-driven timeline animation, sync button, adaptive toggle, sandbox link (per clarification)

**Visual requirements from spec**:
- Asymmetric bento grid: 4-column on desktop (2+1+1+2), 2-column on tablet, single column on mobile
- Card style: rounded-2xl, bg-white/50 backdrop-blur-md, border border-[#DEEAFB]/60
- Step number: large faded watermark in card
- Icon: navy square (40x40px, rounded-xl)
- Title: Nunito bold, primary-navy
- Description: Space Grotesk, text-muted
- Section padding: py-24, px-6, max-width 1240px

**Responsive behavior**:
- Mobile (< 640px): Single column stack
- Tablet (640px–1023px): 2-column grid
- Desktop (>= 1024px): 4-column asymmetric (2+1+1+2)

**RTL/LTR considerations**:
- Grid order mirrors in RTL
- Step numbers and text alignment follow RTL

**Interaction behavior**:
- Cards have hover lift effect
- No clickable elements (informational only per clarification)

**Animation requirements**:
- FadeInView for card entrance (existing)
- Hover transitions: 300ms ease-in-out
- No scroll-driven timeline animation (removed per clarification)

**Accessibility requirements**:
- `<section>` with `aria-labelledby` heading
- h2 with unique ID
- Step numbers are decorative
- Icons marked `aria-hidden="true"`
- Reduced motion: hover effects disabled

**Dependencies on previously completed units**: Unit 1 (tokens, font)

**Acceptance criteria**:
- [ ] Bento grid layout renders correctly at all breakpoints
- [ ] 4 step cards with correct content
- [ ] Step number watermarks visible
- [ ] Hover effects work
- [ ] Responsive layout correct (1→2→4 columns)
- [ ] RTL grid mirrors
- [ ] Build passes

**Validation steps**:
1. Run `pnpm build` — must pass
2. Run `pnpm dev` — verify bento grid renders
3. Visual comparison with prototype at 1280px, 768px, 375px
4. Hover over cards — verify lift effect
5. Switch to Arabic — verify RTL mirror

---

### Unit 5: Features

**Goal**: Rewrite the Features section with masonry layout and 4 feature cards matching the prototype's visual style.

**Files to modify**:
- `src/features/home/components/sections/Features.tsx` — complete rewrite
- `src/shared/components/ui/FeatureCard.tsx` — adapt for masonry layout
- `messages/en.json` — update features translation keys
- `messages/ar.json` — update features translation keys

**Existing components/files to reuse**:
- `Container.tsx` (section container)
- `FeatureCard.tsx` (feature card — adapt for masonry)
- `HeadingReveal.tsx` (heading animation)
- `FadeInView.tsx` (card entrance animation)
- Lucide React icons (Target, Bot, TrendingUp, Lightbulb)
- `useT()` hook (i18n)
- Existing `glass-card` utility
- Existing `hover-lift` utility

**Scope of changes**:
1. Replace uniform 4-column grid with 3-column masonry layout
2. Section badge: "Core Capabilities" (pill)
3. Heading: "Everything You Need to Learn Faster" (h2, Nunito extrabold)
4. Subtitle: explains combined value of features
5. 4 feature cards with varied heights for visual interest:
   - Card 1: "Personalized Learning Plans" (Target icon)
   - Card 2: "AI-Powered Assistance" (Bot icon)
   - Card 3: "Progress Tracking" (TrendingUp icon)
   - Card 4: "Smart Feedback" (Lightbulb icon)
6. Each card: icon in navy square, title (Nunito bold), description (Space Grotesk muted)
7. Hover effects: -translate-y-1, bg-white/75, shadow-xl

**Visual requirements from spec**:
- 3-column masonry on desktop with varied card heights
- 2-column on tablet, single column on mobile
- Card style: rounded-2xl, bg-white/50 backdrop-blur-md, border border-[#DEEAFB]/60
- Icon: navy square (40x40px, rounded-xl)
- Title: Nunito bold, primary-navy
- Description: Space Grotesk, text-muted
- Section padding: py-24, px-6, max-width 1240px

**Responsive behavior**:
- Mobile (< 640px): Single column stack
- Tablet (640px–1023px): 2-column grid
- Desktop (>= 1024px): 3-column masonry with varied heights

**RTL/LTR considerations**:
- Grid order mirrors in RTL
- Icon placement and text alignment follow RTL

**Interaction behavior**:
- Cards have hover lift effect
- Informational only (no click targets)

**Animation requirements**:
- FadeInView for card entrance (existing)
- Hover transitions: 300ms ease-in-out

**Accessibility requirements**:
- `<section>` with `aria-labelledby` heading
- h2 with unique ID
- Icons marked `aria-hidden="true"`
- Card titles serve as accessible names
- Reduced motion: hover effects disabled

**Dependencies on previously completed units**: Unit 1 (tokens, font)

**Acceptance criteria**:
- [ ] Masonry layout renders correctly at all breakpoints
- [ ] 4 feature cards with correct content
- [ ] Varied card heights visible on desktop
- [ ] Hover effects work
- [ ] Responsive layout correct (1→2→3 columns)
- [ ] RTL grid mirrors
- [ ] Build passes

**Validation steps**:
1. Run `pnpm build` — must pass
2. Run `pnpm dev` — verify masonry grid renders
3. Visual comparison with prototype at 1280px, 768px, 375px
4. Hover over cards — verify lift effect
5. Switch to Arabic — verify RTL mirror

---

### Unit 6: CTA

**Goal**: Rewrite the CTA section with dark navy background and centered layout matching the prototype's visual direction.

**Files to modify**:
- `src/features/home/components/sections/CTA.tsx` — complete rewrite
- `messages/en.json` — update cta translation keys
- `messages/ar.json` — update cta translation keys

**Existing components/files to reuse**:
- `Container.tsx` (section container)
- `Button.tsx` or `SpecularButton.tsx` (CTA button)
- `HeadingReveal.tsx` (heading animation)
- `FadeInView.tsx` (description animation)
- `useT()` hook (i18n)

**Scope of changes**:
1. Replace alternating background (#EFF4FB) with midnight-navy (#0A1930)
2. Replace two-column layout (text + telemetry dashboard) with centered single-column
3. Heading: "Ready to Synthesize Your AI Career Roadmap?" (Nunito extrabold, white)
4. Description: reinforcing value proposition (Space Grotesk, slate/light gray)
5. CTA: "Start Learning Free" (primary styling, rounded-full)
6. Sub-text: "No credit card required" (small, muted)
7. Ambient blur glow (decorative) behind content
8. Remove: telemetry dashboard card (per clarification)

**Visual requirements from spec**:
- Midnight-navy (#0A1930) background
- Ambient blur glow (decorative)
- Centered layout, max-width constraint
- Heading: Nunito extrabold, white
- Description: Space Grotesk, slate/light gray
- CTA: primary styling, rounded-full, shadow-md
- Sub-text: small, muted
- Section padding: py-24, px-6

**Responsive behavior**:
- Mobile (< 640px): Full-width centered, heading scales down, button full-width
- Tablet (640px–1023px): Centered with moderate width
- Desktop (>= 1024px): Centered with max-width, button natural size

**RTL/LTR considerations**:
- Text alignment mirrors to right in RTL

**Interaction behavior**:
- CTA button hover lift (-translate-y-0.5, shadow-lg)
- CTA button active snap-back (translate-y-0)
- Keyboard accessible

**Animation requirements**:
- HeadingReveal for heading (existing)
- FadeInView for description (existing)
- Button hover transitions (existing)

**Accessibility requirements**:
- `<section>` with `aria-labelledby` heading
- h2 with unique ID
- CTA button has descriptive accessible name
- Visible focus ring
- Decorative blur glow marked `aria-hidden="true"`

**Dependencies on previously completed units**: Unit 1 (tokens, font, dark-section utility)

**Acceptance criteria**:
- [ ] Dark navy background renders
- [ ] Heading in Nunito, white, correct size
- [ ] CTA button visible and functional
- [ ] Sub-text visible below button
- [ ] Responsive layout correct
- [ ] RTL alignment mirrors
- [ ] Build passes

**Validation steps**:
1. Run `pnpm build` — must pass
2. Run `pnpm dev` — verify CTA section renders
3. Visual comparison with prototype
4. Click CTA — verify behavior
5. Switch to Arabic — verify RTL

---

### Unit 7: Footer

**Goal**: Rewrite the Footer with midnight-navy background and horizontal layout matching the prototype's visual design.

**Files to modify**:
- `src/shared/components/layout/Footer.tsx` — complete rewrite
- `messages/en.json` — update footer translation keys
- `messages/ar.json` — update footer translation keys

**Existing components/to reuse**:
- `Logo.tsx` (existing brand logo)
- `Container.tsx` (section container)
- `useT()` hook (i18n)
- Existing `Link` from `@/i18n/navigation`

**Scope of changes**:
1. Replace frosted glass background with midnight-navy (#0A1930)
2. Replace two-column brand/copyright layout with horizontal (logo | links | copyright)
3. Logo and "AI Mentor" text (Nunito extrabold)
4. Links: Privacy Policy, Terms of Service, Resource Trust Policy, Status (green dot)
5. Copyright: "© 2025 AI Mentor Inc. Precision intelligence for human mastery."
6. Top border for structural separation

**Visual requirements from spec**:
- Midnight-navy (#0A1930) background
- Horizontal layout: logo left, links center, copyright right
- Logo: terminal icon in navy square + text (Nunito extrabold)
- Links: slate/light gray, white on hover
- Copyright: muted text
- Padding: py-12, px-6, max-width 1240px

**Responsive behavior**:
- Mobile (< 640px): Stacked vertically (brand, links, copyright)
- Tablet (640px–1023px): Horizontal layout begins
- Desktop (>= 1024px): Full horizontal with generous spacing

**RTL/LTR considerations**:
- Layout mirrors: logo right, links left in RTL

**Interaction behavior**:
- Links have hover effect (text-white)
- Links are clickable (placeholder targets)

**Animation requirements**:
- Minimal — static footer
- TextReveal for copyright (existing, optional)

**Accessibility requirements**:
- `<footer>` landmark element
- Logo has alt text
- Links wrapped in `<nav>` with `aria-label="Footer navigation"`

**Dependencies on previously completed units**: Unit 1 (tokens, font)

**Acceptance criteria**:
- [ ] Dark navy background renders
- [ ] Horizontal layout with logo, links, copyright
- [ ] Links visible and hoverable
- [ ] Responsive layout correct (stacked → horizontal)
- [ ] RTL layout mirrors
- [ ] Build passes

**Validation steps**:
1. Run `pnpm build` — must pass
2. Run `pnpm dev` — verify footer renders
3. Visual comparison with prototype
4. Hover over links — verify color change
5. Switch to Arabic — verify RTL mirror

---

## Dependency / Order Summary

```text
Unit 1: Global CSS / Visual System
    │
    ├──► Unit 2: Header (needs tokens + font)
    ├──► Unit 3: Hero (needs tokens + font + dark-section utility)
    ├──► Unit 4: How It Works (needs tokens + font)
    ├──► Unit 5: Features (needs tokens + font)
    ├──► Unit 6: CTA (needs tokens + font + dark-section utility)
    └──► Unit 7: Footer (needs tokens + font)
```

**Why each unit can be implemented and reviewed independently:**

- **Unit 1** is the foundation — it replaces the global color tokens, display font, and container width with the new primary visual system, and adds the `.dark-section` utility. All other units depend on these tokens. **Because this unit changes project-wide defaults, its review must include a cross-page audit** (dashboard, onboarding, auth, and any other page consuming the affected tokens) to confirm acceptable impact. A `--color-teal-*` alias fallback is available as contingency if critical breakage is found.

- **Units 2–7** each modify a single section/component. They depend only on Unit 1's tokens. They do not depend on each other. Each can be implemented, reviewed, and merged independently.

- **Unit 2 (Header)** and **Unit 7 (Footer)** are shared components — changes affect the layout wrapper. Review should verify they don't break other pages that use the same layout.

- **Units 3, 4, 5, 6** are feature-specific section components used only on the Home Page. They have zero risk of affecting other pages.

**Recommended implementation order**: 1 → 2 → 3 → 4 → 5 → 6 → 7

**After each unit**: STOP → manual review/testing → apply feedback → STOP. Do not proceed automatically.

## Complexity Tracking

**Constitution Principle X — Controlled Violation (Global Visual System Replacement)**

The Global Visual System change replaces the existing teal/emerald color tokens with the new navy/blue/purple palette as the project's primary system. This affects all pages that consume these tokens (dashboard, onboarding, auth). This is justified because:

1. The approved Prototype Specification defines a new primary visual identity.
2. Keeping two competing color systems creates maintenance burden and visual inconsistency.
3. Cross-page impact audit is mandatory during Unit 1 implementation.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle X: Global visual system replacement affects all pages | The approved Prototype Specification defines a new primary visual identity (navy/blue/purple). Making it additive-only leaves two competing color systems and inconsistent UX across pages. | Keeping old teal tokens alongside new navy tokens creates maintenance burden, confusion about which tokens to use, and visual inconsistency between the Home Page and other pages. |
| Font display change (Space Grotesk → Nunito for headings) | The approved Prototype Specification uses Nunito for headings to create visual hierarchy differentiation from body text. | Keeping Space Grotesk for headings sacrifices the visual hierarchy established in the approved design. |
| Container width change (1152px → 1240px) | The approved Prototype Specification uses 1240px for section containers. | Keeping 1152px means the Home Page won't match the approved visual specification's spacing. |

| Concern | Mitigation |
|---------|------------|
| Nunito font addition increases bundle | Load only needed weights (600, 700, 800, 900), use `display: swap` |
| Dark-first theme + light content sections | Use `.dark-section` utility that overrides theme colors locally |
| Existing StepCard/FeatureCard may need adaptation | Modify existing components, don't create duplicates |
| SpecularButton THEME_COLORS hardcodes old teal hex | Update THEME_COLORS to match new navy palette during Unit 1 |
