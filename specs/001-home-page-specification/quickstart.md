# Quickstart Validation Guide: Home Page Redesign

**Date**: 2026-09-10
**Feature**: 001-home-page-specification

## Prerequisites

- Node.js 18+ installed
- pnpm installed
- Project dependencies installed (`pnpm install`)

## Setup

```bash
cd "C:\Masar\AI Mentor\my-app"
pnpm install
```

## Validation Scenarios

### Scenario 1: Global CSS / Visual System (Unit 1)

**Command**: `pnpm build`

**Expected**: Build completes without errors. No TypeScript or CSS compilation failures.

**Visual check**: `pnpm dev` → open http://localhost:3000 → verify:
- Nunito font loads (inspect heading elements in dev tools → computed font-family includes "Nunito")
- Navy/blue tokens are the primary Tailwind utilities (verify no teal hex remains in computed styles)
- Container width is 1240px on desktop
- `.dark-section` utility produces midnight-navy background
- Cross-page audit: navigate to dashboard, onboarding, auth pages → verify new navy palette renders correctly with no broken layouts or unreadable text
- If any page breaks critically, the `--color-teal-*` alias fallback must be applied before proceeding

### Scenario 2: Header (Unit 2)

**Command**: `pnpm dev`

**Visual check**: Open http://localhost:3000 → verify:
- Navbar is fixed at top with glass morphism (frosted backdrop blur)
- Nav links visible on tablet/desktop
- Mobile hamburger at < 640px opens dropdown
- Smooth scroll works for anchor links
- RTL: switch to Arabic → navbar mirrors

### Scenario 3: Hero (Unit 3)

**Command**: `pnpm dev`

**Visual check**: Open http://localhost:3000 → verify:
- Dark navy background with dot grid pattern
- Headline in Nunito, white, correct size
- Two CTAs visible: "Generate Free Roadmap" + "Explore Curriculums"
- Hover effects on CTAs (lift + shadow)
- Responsive: mobile (< 640px) text scales down, tablet (640px) medium, desktop (1024px+) full
- RTL: text alignment mirrors

### Scenario 4: How It Works (Unit 4)

**Command**: `pnpm dev`

**Visual check**: Open http://localhost:3000 → scroll to How It Works → verify:
- Bento grid layout (4 columns on desktop, 2 on tablet, 1 on mobile)
- 4 step cards with correct titles and descriptions
- Step number watermarks visible
- Hover lift effect on cards
- Section badge "Precision Learning Pipeline" visible
- RTL: grid order mirrors

### Scenario 5: Features (Unit 5)

**Command**: `pnpm dev`

**Visual check**: Open http://localhost:3000 → scroll to Features → verify:
- Masonry layout (3 columns on desktop with varied heights)
- 4 feature cards with icons, titles, descriptions
- Hover lift effect on cards
- Section badge "Core Capabilities" visible
- RTL: grid order mirrors

### Scenario 6: CTA (Unit 6)

**Command**: `pnpm dev`

**Visual check**: Open http://localhost:3000 → scroll to CTA → verify:
- Dark navy background
- Heading "Ready to Synthesize Your AI Career Roadmap?"
- CTA button "Start Learning Free"
- Sub-text "No credit card required"
- Hover effect on CTA
- RTL: text alignment mirrors

### Scenario 7: Footer (Unit 7)

**Command**: `pnpm dev`

**Visual check**: Open http://localhost:3000 → scroll to footer → verify:
- Dark navy background
- Horizontal layout: logo | links | copyright
- Links visible: Privacy Policy, Terms of Service, Resource Trust Policy, Status
- Copyright text correct
- Hover effect on links (text → white)
- RTL: layout mirrors (logo right, links left)

### Scenario 8: Full Page Integration

**Command**: `pnpm build && pnpm start`

**Visual check**: Open production build → verify:
- All 7 sections render in correct order
- No console errors
- No layout overflow at any breakpoint
- RTL/RTL switching works without page reload
- All animations respect prefers-reduced-motion

### Scenario 9: Cross-Page Regression

**Command**: `pnpm dev`

**Visual check**: Navigate to other pages (dashboard, onboarding, auth) → verify:
- Navy/blue/purple palette renders correctly with no unreadable text or contrast issues
- No visual breakage from container width change (1240px) or removed teal/emerald tokens
- Existing components render correctly (fonts, buttons, cards, forms)
- No new console errors
- If any page depends critically on removed legacy tokens, apply the `--color-teal-*` alias fallback and migrate those pages in a follow-up

## Performance Checks

- **Lighthouse**: Run Lighthouse audit on homepage → verify no performance regression
- **Bundle size**: Check `pnpm build` output → verify Nunito font doesn't significantly increase bundle
- **Font loading**: Verify Nunito loads with `display: swap` (no FOIT)

## Accessibility Checks

- **Keyboard**: Tab through entire homepage → verify all interactive elements reachable
- **Screen reader**: Verify headings hierarchy (h1 → h2), landmarks (header, nav, main, section, footer)
- **Contrast**: Verify all text meets WCAG AA against backgrounds
- **Reduced motion**: Enable prefers-reduced-motion → verify animations disabled
