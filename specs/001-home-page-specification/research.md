# Research: Home Page — Adaptive Intelligence Redesign

**Date**: 2026-09-10
**Feature**: 001-home-page-specification

## Decisions

### 1. Font Strategy: Nunito for Headings

**Decision**: Add Nunito via `next/font/google` in `src/app/layout.tsx`. Update the display font token (`--font-display`) to Nunito (600, 700, 800, 900) so headings throughout the project use the new primary heading font, with the existing `[dir="rtl"]` override pointing to IBM Plex Sans Arabic for Arabic headings. Keep Space Grotesk as the body/UI font.

**Rationale**: The Prototype Specification specifies Nunito (extrabold 900, bold 700, semibold 600) for headings and Space Grotesk for body text. The existing codebase uses Space Grotesk for both display and body. Making Nunito the project-wide heading font aligns with the approved visual design and the user's request for a primary visual system. The RTL override keeps Arabic headings on the existing Arabic typeface since Nunito does not support Arabic glyphs.

**Cross-page impact**: Updating `--font-display` affects all heading elements project-wide. Verify heading rendering on dashboard, onboarding, and auth pages. If this causes unacceptable regression, keep a separate `--font-heading` token and scope Nunito to Home Page sections only.

**Alternatives considered**:
- Keep Space Grotesk for headings: Rejected — the prototype explicitly uses Nunito for visual hierarchy differentiation.
- Use Inter for headings: Rejected — Inter is already loaded but the prototype specifies Nunito.
- Create a separate `--font-heading` token: Considered but deferred — simpler to update `--font-display` for now. If other pages break, create `--font-heading` as a separate token.

**Bundle impact**: Nunito adds ~20-30KB gzipped for 4 weights. Using `display: swap` and `preload: true` minimizes impact.

### 2. Color System: Navy/Blue/Purple as the New Primary System

**Decision**: Replace the existing teal/emerald color tokens with the navy/blue/purple palette as the project's primary color system. The new Global Visual System becomes the default for the entire project. Old teal/emerald tokens are removed or repurposed where no longer required.

**Rationale**: The approved Prototype Specification defines navy/blue/purple as the product's visual identity. Making it additive-only would leave two competing color systems (teal + navy), creating maintenance burden and visual inconsistency across pages. The user explicitly requested the new system be the primary one, with old tokens/styles removed where not required.

**Cross-page impact**: This is a breaking change for any component using `bg-primary`, `text-primary`, `border-primary`, `text-secondary`, `bg-accent`, etc. A cross-page audit is mandatory before merging — the implementation must scan all components under `src/features/dashboard/`, `src/features/onboarding/`, `src/features/auth/` for old token usage and migrate or verify compatibility.

**Alternatives considered**:
- Additive-only (keep teal, add navy in parallel): Rejected by user — explicitly requested the new system be primary with old tokens removed.
- Use CSS custom properties outside `@theme`: Rejected — would not generate Tailwind utilities.
- Create a separate CSS file for Home Page tokens: Rejected — unnecessary complexity; all tokens belong in globals.css.
- Teal alias fallback: Retained as contingency — if cross-page audit reveals critical breakage, add `--color-teal-*` aliases temporarily and remove after migrating affected pages.

### 3. Container Width: 1240px (Project-Wide)

**Decision**: Update `--container-content` from 72rem (1152px) to 77.5rem (1240px) as the project-wide container token. Add `--container-hero` (63.75rem / 1020px) for hero text.

**Rationale**: The Prototype Specification uses 1240px for nav and sections, 1020px for hero text. The existing 1152px is close but not exact. 1240px becomes part of the primary visual system applied project-wide.

**Cross-page impact**: This changes layout width for every page using the `Container` component with `max-w-(--container-content)`. Verify no layout overflow on dashboard, onboarding, auth pages.

**Alternatives considered**:
- Keep 1152px: Rejected — the prototype explicitly uses 1240px.
- Add a new token without updating existing: Considered but creates two competing container widths.
- Use 1240px only for Home Page sections: Possible but adds unnecessary conditional logic and leaves two spacing standards.

**Risk**: Container width change affects all pages using `Container` component. Must verify no layout breakage on dashboard, onboarding, auth pages.

### 4. Dark/Light Section Approach

**Decision**: Use a `.dark-section` CSS utility class that applies dark theme tokens (midnight-navy background, white text) regardless of the current theme mode. Apply this class to Hero, CTA, and Footer sections.

**Rationale**: The Home Page needs dark navy backgrounds for Hero/CTA/Footer even when the user is in light mode. The existing theme system is dark-first with `.light` as opt-in. A utility class that forces dark section styling is the simplest approach.

**Alternatives considered**:
- Use the existing dark theme class: Rejected — would force entire page to dark mode.
- Create a new theme variant: Rejected — over-engineered for 3 sections.
- Use inline styles: Rejected — inconsistent with Tailwind utility approach.
- Use CSS `color-scheme: dark` on section: Considered but may affect form inputs.

### 5. Animation Strategy

**Decision**: Reuse existing animation components (HeadingReveal, FadeInView, TextReveal, ScrollStagger). Add CSS-only keyframes for new animations (marquee, fadeIn). Do not create a global animation system.

**Rationale**: The existing animation library is comprehensive and well-tested. The How It Works section no longer needs scroll-driven timeline animation (removed per clarification). New CSS animations are simple keyframes.

**Alternatives considered**:
- Create a unified animation hook: Rejected — existing components already compose well.
- Use CSS-only for all animations: Rejected — existing Framer Motion components provide better UX.
- Add GSAP for new animations: Rejected — GSAP is already in bundle but not needed for simple keyframes.

### 6. i18n Translation Keys

**Decision**: Update existing translation namespaces (`hero`, `howItWork`, `features`, `cta`, `footer`, `nav`) with new content matching the prototype. Do not create new namespaces.

**Rationale**: The existing translation structure is well-organized. Updating existing keys is simpler than creating new ones.

**Alternatives considered**:
- Create a new `home-redesign` namespace: Rejected — unnecessary complexity.
- Hardcode English text: Rejected — violates i18n requirements.
