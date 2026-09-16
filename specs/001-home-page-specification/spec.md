# Feature Specification: Home Page — Adaptive Intelligence

**Feature Branch**: `001-home-page-specification`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Create a product and UX specification for the Home Page of the existing AI Mentor frontend."

## Overview

The Home Page is the primary public-facing entry point for Adaptive Intelligence, an AI-powered adaptive learning SaaS. It serves as the marketing and conversion surface, introducing visitors to the product's value proposition, explaining how the AI mentor works, showcasing core features, and guiding users toward account creation.

The page must present a clean, authoritative interface using Precision Glassmorphism with deep navy structural anchoring for Hero, CTA, and Footer, and light-first surfaces for content sections. It must support Arabic and English with full RTL/LTR parity, respond fluidly across mobile, tablet, and desktop, and reuse the existing design system and component architecture without introducing competing patterns.

The specification defines the Home Page as a collection of independently implementable sections, each specified in detail so that implementation can proceed one section at a time with human review between each.

## Clarifications

### Session 2026-09-10

- Q: Should the spec cover all 9 sections and 4 modals from the Prototype Specification, or keep the current 7-section scope? → A: The Prototype Specification is a visual/UX design reference only, not a source of truth for production feature scope. Keep the production scope defined by the existing 7 sections. Do not add prototype-only sections or modals solely because they exist in the prototype. Use the Prototype Specification only for visual design, styling, layout patterns, responsive behavior, and interaction patterns where applicable.
- Q: Which visual direction should the Hero section follow — the current spec's AI Learning Path Card or the Prototype Specification's dark navy hero? → A: Follow the Prototype Hero exactly (dark midnight-navy background, dot grid pattern, headline, subtitle, dual CTAs) — remove the Badge and Trust line only. Everything else unchanged.
- Q: Should the How It Works section use the prototype's bento grid or keep the current vertical timeline? → A: Use the Prototype's asymmetric bento grid layout and visual design. Do not include prototype-specific interactive elements (sync button, adaptive toggle, sandbox link) unless already part of production requirements.
- Q: Should the Features section use the prototype's masonry layout or keep the current 4-card grid? → A: Use the Prototype's masonry layout and visual style, but keep production scope at 4 feature cards. Apply the Prototype's visual hierarchy, spacing, card variation, and richer presentation style without adding prototype-only features or content.
- Q: Which visual direction should the CTA section follow — simple centered or prototype's dark navy with telemetry? → A: Use the Prototype's midnight-navy visual direction and overall styling, but keep a centered single-column production CTA without the prototype-specific telemetry dashboard.
- Q: Which visual direction should the Footer follow? → A: Follow the Prototype's footer: midnight-navy background, horizontal layout with logo, links (Privacy Policy, Terms of Service, Resource Trust Policy, Status), and copyright.

## Goals

1. Clearly communicate the Adaptive Intelligence value proposition to first-time visitors within the first viewport.
2. Build trust and credibility through a polished, professional visual presentation.
3. Explain how the AI mentor works in a simple, step-by-step narrative.
4. Showcase core product features that differentiate Adaptive Intelligence from generic learning platforms.
5. Drive visitors toward account creation through strategic, well-placed calls to action.
6. Deliver a fully accessible, internationalized, responsive experience in both Arabic and English.
7. Respect the existing architecture, design system, and component patterns — no competing UI systems.
8. Enable incremental, section-by-section implementation with independent review cycles.

## Non-goals

1. Backend API implementation or REST endpoint design.
2. Authentication flow redesign or login/register page changes.
3. Dashboard, onboarding, or settings page modifications.
4. Global architecture migration (Redux, state management, or routing changes).
5. Dependency replacement or addition of new libraries.
6. Full application redesign beyond the Home Page scope.
7. Performance optimization of unrelated pages.
8. SEO metadata overhaul beyond the Home Page.
9. Analytics or tracking implementation.
10. Content management system integration.

## Design Principles

### Light-First Precision Glassmorphism

The Home Page operates in light mode as its primary presentation. The interface uses frosted glass surfaces with subtle backdrop blur, soft ambient shadows, and clean white/ice-blue surfaces anchored by deep navy structural elements.

### Deep Navy Structural Anchoring

Primary navy (#12314D) and deep midnight navy (#0A1930) provide structural weight — used for headings, key typography, and anchoring visual hierarchy. These colors establish authority and professionalism.

### White and Soft Ice-Blue Surfaces

Main canvas (#FFFFFF) and alternating section backgrounds (#EFF4FB) create airy, breathing surfaces. Light blue borders/fills (#DEEAFB) provide subtle structural definition without visual heaviness.

### Secondary Blue for Informative UI

Secondary blue (#1D4E89) serves informational elements — secondary actions, supporting text, and informative indicators that guide without competing with primary actions.

### Purple Reserved for AI/Progression States

Accent purple (#7C3AED) is reserved exclusively for active AI states, progression indicators, and live/active affordances. It must not be used for general decorative purposes or primary actions.

### Minimal Ambient Shadows

Shadows are used sparingly and purposefully — only for elevation differentiation (cards, floating panels, dropdowns). No heavy drop shadows or decorative shadow effects.

### Clean, Airy, Authoritative, Frictionless

The overall impression is one of professional clarity — every element has a purpose, spacing is generous, and the visual path from headline to call-to-action is unobstructed.

## Page Structure

The Home Page is composed of the following independently implementable sections, listed in their intended display order:

| Order | Section               | Component Location                          | Independent |
|-------|-----------------------|---------------------------------------------|-------------|
| 1     | Global Visual System  | `src/app/globals.css` (existing)            | Foundation  |
| 2     | Header (Navbar)       | `src/shared/components/layout/Navbar.tsx`   | Yes         |
| 3     | Hero                  | `src/features/home/components/sections/Hero.tsx` | Yes    |
| 4     | How It Works          | `src/features/home/components/sections/HowItWork.tsx` | Yes |
| 5     | Features              | `src/features/home/components/sections/Features.tsx` | Yes  |
| 6     | CTA                   | `src/features/home/components/sections/CTA.tsx` | Yes    |
| 7     | Footer                | `src/shared/components/layout/Footer.tsx`   | Yes         |

Each section is specified independently below. The Global Visual System section defines styling tokens and adaptations that all other sections consume.

---

## Detailed Section Specifications

---

### Section 1: Global Visual System / Styling Foundation

#### Purpose

Establish the visual foundation that all Home Page sections consume. This section adapts the existing `globals.css` design token system to support the Adaptive Intelligence visual identity — light-first for content sections, with dark navy anchoring for Hero, CTA, and Footer — without introducing a competing styling system.

#### Content

This section does not contain visible content. It defines:

- Color token mappings for the Adaptive Intelligence palette (navy, blue, purple, surfaces).
- Typography token adaptations for Nunito (headings/metrics) and Space Grotesk (body/UI/labels/data).
- Glassmorphism utility classes (glass-card, glass-surface).
- Shadow tokens for the ambient shadow system.
- Section background alternation tokens.

#### User Interaction

None. This is a foundational styling layer.

#### Visual Intent

The visual system must produce:

- Light-first content sections with #FFFFFF as the main canvas (How It Works, Features).
- Dark navy (#0A1930) anchoring for Hero, CTA, and Footer sections.
- Alternating section backgrounds using #EFF4FB for visual rhythm in light sections.
- Deep navy (#12314D) for headings, buttons, and structural elements on light surfaces.
- Secondary blue (#1D4E89) for informative UI elements.
- Purple (#7C3AED) reserved for AI/progression states only.
- Muted text (#667085) for secondary/supporting copy on light surfaces.
- Slate/light gray text for content on dark navy surfaces.
- Minimal ambient shadows — only for elevation differentiation.
- Precision Glassmorphism on floating elements (nav, cards) with subtle backdrop blur.
- Container max-width: 1240px for sections, 1020px for hero text.

#### Responsive Behavior

- Token values remain consistent across breakpoints.
- Spacing scale adapts: tighter on mobile, more generous on desktop.
- Container max-width: 1240px (nav, sections), 1020px (hero text).

#### Accessibility

- All color token combinations must meet WCAG AA contrast ratios.
- Focus ring tokens must be visible against both light and dark surface backgrounds.
- Reduced motion preferences must be respected for all animation tokens.

#### States

Not applicable — this is a styling foundation, not an interactive section.

---

### Section 2: Header (Navbar)

#### Purpose

Provide persistent navigation, brand identification, and primary call-to-action access. The header anchors the user's orientation within the site and provides the first touchpoint for brand recognition.

#### Content

- Brand logo and name ("AI Mentor" or localized equivalent).
- Primary navigation links (Home, About — or localized equivalents).
- "Get Started" call-to-action button.
- Mobile hamburger menu toggle with open/close states.
- Mobile navigation drawer with links and CTA button.

#### User Interaction

- Clicking the logo/brand name navigates to the Home Page.
- Clicking navigation links navigates to the corresponding page.
- Clicking "Get Started" navigates to the authentication page.
- On mobile: clicking the hamburger icon opens/closes the mobile navigation drawer.
- On mobile: clicking a navigation link or the CTA button closes the drawer.
- The header remains sticky at the top of the viewport during scroll.
- Keyboard navigation: all interactive elements must be reachable via Tab.
- Escape key closes the mobile navigation drawer when open.

#### Visual Intent

- Sticky positioning with frosted glass backdrop (glass-card treatment).
- Semi-transparent background with backdrop blur for depth over scrolling content.
- Brand element uses primary navy for the icon and text.
- Navigation links use muted text color, transitioning to primary on hover/active.
- Active page link gets a visible underline indicator.
- "Get Started" button uses primary button styling (primary navy background, white text).
- Mobile drawer slides down with smooth animation.
- Subtle bottom border for structural separation from page content.
- Generous horizontal padding matching the content container.

#### Responsive Behavior

- **Mobile** (< 640px): Logo + hamburger icon only. Navigation links hidden. Full-width mobile drawer with stacked links and full-width CTA button.
- **Tablet** (640px - 1023px): Logo + horizontal navigation links + CTA button. No hamburger.
- **Desktop** (>= 1024px): Logo + horizontal navigation links + CTA button with generous spacing.
- **RTL**: Navigation links mirror to the right side. Hamburger menu animation direction reverses. Logo moves to the right.

#### Accessibility

- `<header>` landmark element.
- Navigation wrapped in `<nav>` with `aria-label="Main navigation"`.
- Mobile toggle button has `aria-label` ("Open menu" / "Close menu").
- Mobile drawer has `aria-expanded` reflecting open/closed state.
- Active page link has `aria-current="page"`.
- Focus trap within mobile drawer when open.
- All interactive elements have visible focus indicators.
- Skip navigation link as first focusable element.

#### States

- **Default**: Sticky header with frosted glass background.
- **Scrolled**: Maintains sticky position; background opacity may increase for contrast.
- **Mobile menu closed**: Hamburger icon visible, drawer collapsed (max-h-0, opacity-0).
- **Mobile menu open**: X icon visible, drawer expanded with links and CTA.
- **Focus**: Visible focus ring on all interactive elements.
- **Hover**: Navigation links transition to primary color; CTA button darkens slightly.

---

### Section 3: Hero

#### Purpose

Make the first impression. Communicate the core value proposition of AI Mentor immediately — that a dynamic AI-powered career roadmap can be synthesized in real time. Drive the visitor toward the primary conversion action (roadmap generation).

#### Content

- Primary headline: "Your Dynamic AI Career Roadmap, Synthesized in Real Time" (Nunito extrabold, up to 56px).
- Supporting subtitle: descriptive paragraph about diagnostic telemetry and GPU skills (Space Grotesk, text-muted).
- Dual CTA buttons:
  - Primary: "Generate Free Roadmap" (dark navy bg, white text, rounded-full).
  - Secondary: "Explore Curriculums" (light blue bg #DEEAFB, blue text #1D4E89, rounded-full).
- Background: midnight-navy (#0A1930) with dot grid pattern overlay and ambient blur glow.

#### User Interaction

- Clicking "Generate Free Roadmap" opens the Roadmap Modal (not implemented in this spec — placeholder behavior: scroll to How It Works or navigate to authentication).
- Clicking "Explore Curriculums" scrolls to the How It Works section (#how-it-works).
- Keyboard users can reach and activate both CTA buttons.
- No other interactive elements in this section.

#### Visual Intent

- Full-width section with midnight-navy (#0A1930) background.
- Dot grid pattern overlay on the dark background.
- Ambient blur glow (decorative, low opacity) behind content for depth.
- Centered text layout, max-width 1020px.
- Headline: Nunito extrabold, up to 56px on desktop, white text.
- Subtitle: Space Grotesk, muted text (slate/light gray on dark bg).
- Primary CTA: bg-primary-navy (#12314D), text-white, rounded-full, font-bold, shadow-md.
- Secondary CTA: bg-light-blue-bg (#DEEAFB), text-light-blue-text (#1D4E89), rounded-full, font-bold.
- Both CTAs have hover lift effect (-translate-y-0.5, shadow-lg) and active snap-back (translate-y-0).
- Section padding: py-24, px-6.

#### Responsive Behavior

- **Mobile** (< 640px): Reduced padding (pt-36, pb-20). Headline scales to text-4xl. CTAs stack vertically or side-by-side with full-width.
- **Tablet** (640px - 1023px): Medium text size (text-5xl). CTAs side-by-side.
- **Desktop** (>= 1024px): Largest text (text-[56px]). Max-width 1020px centered.
- **RTL**: Text alignment mirrors to right. Layout direction reverses.

#### Accessibility

- Section wrapped in `<section>` with `aria-labelledby` pointing to the heading.
- Heading uses `<h1>` element with unique ID.
- Decorative dot grid and blur glow marked `aria-hidden="true"`.
- Both CTA buttons have descriptive accessible names.
- Reduced motion: ambient animations disabled; content remains fully visible.

#### States

- **Default**: Full hero display with headline, subtitle, and dual CTAs on dark background.
- **CTA hover**: Button lifts (-translate-y-0.5), shadow-lg.
- **CTA focus**: Visible focus ring around the button.
- **CTA active**: Button snaps back (translate-y-0).
- **Reduced motion**: All decorative animations disabled; content remains fully visible.

---

### Section 4: How It Works

#### Purpose

Educate visitors on the product workflow in a simple, sequential narrative. Reduce cognitive complexity by breaking the AI mentor experience into four clear steps, building confidence that the product is approachable and actionable.

#### Content

- Section badge: "Precision Learning Pipeline" (uppercase, tracked, bold, bg-light-blue-bg, text-light-blue-text, rounded-full).
- Section heading: "Bento Learning Architecture" (Nunito extrabold, primary-navy).
- Section subtitle: describes 4-phase curriculum engine (Space Grotesk, text-muted).
- Four step cards in an asymmetric bento grid layout:
  - **Step #01** (large, 2col x 2row on desktop): "Diagnostic Profile Sync" — step number, icon in navy square, title, description. Step number as large faded watermark.
  - **Step #02** (1col): "Real-time Curriculum Synthesis" — step number, icon, title, description.
  - **Step #03** (1col): "Sandbox Proof & Calibration" — step number, icon, title, description.
  - **Step #04** (2col): "Dynamic Milestone Refactoring" — step number, icon, title, description.
- Each card: rounded-2xl, glass morphism bg (bg-white/50 backdrop-blur-md), light border (border border-[#DEEAFB]/60).
- Icon in navy square (40x40px, rounded-xl).
- Title: Nunito bold, primary-navy.
- Description: Space Grotesk, text-muted.

#### User Interaction

- Step cards are informational only in this spec — not interactive.
- No clickable elements, sync buttons, toggles, or sandbox links.
- Cards have hover effects: -translate-y-1, bg-white/75, shadow-xl (300ms ease-in-out).
- Keyboard users can Tab through cards if they become interactive in future.

#### Visual Intent

- Full-width section, py-24, px-6, max-width 1240px centered.
- Asymmetric bento grid: 4-column layout on desktop (2+1+1+2 cols), 2 columns on tablet, single column on mobile.
- Section badge pill at top, centered.
- Heading (h2) and subtitle centered below badge.
- Step number watermark: large, faded text (e.g., #0A1930 at 5-8% opacity) positioned in card.
- Card internal padding: p-6 to p-8.
- Grid gap: gap-6.
- Hover: card lifts, background lightens, shadow intensifies.

#### Responsive Behavior

- **Mobile** (< 640px): Single column stack, all cards full-width. Step #01 and #04 lose their 2-col span.
- **Tablet** (640px - 1023px): 2-column grid. Step #01 may span 2 rows.
- **Desktop** (>= 1024px): 4-column asymmetric layout (2+1+1+2). Step #01 spans 2 cols x 2 rows. Step #04 spans 2 cols.
- **RTL**: Grid order mirrors. Step numbers and text alignment follow RTL rules.

#### Accessibility

- Section wrapped in `<section>` with `aria-labelledby` pointing to heading.
- Heading uses `<h2>` with unique ID.
- Step cards use semantic structure (article or list item).
- Step numbers are decorative — actual content is in the title and description.
- Icons are decorative — marked `aria-hidden="true"`.
- Reduced motion: hover lift effects disabled.

#### States

- **Default**: All four step cards visible in bento grid.
- **Hover**: Card lifts (-translate-y-1), bg-white/75, shadow-xl.
- **Reduced motion**: Hover transitions disabled.

---

### Section 5: Features

#### Purpose

Showcase the core product features that differentiate Adaptive Intelligence. Build credibility by demonstrating the breadth of capability through a visually dynamic masonry layout with varied card heights.

#### Content

- Section badge: "Core Capabilities" (uppercase, tracked, bold, bg-light-blue-bg, text-light-blue-text, rounded-full).
- Section heading: "Everything You Need to Learn Faster" (Nunito extrabold, primary-navy).
- Section subtitle: explains the combined value of all features (Space Grotesk, text-muted).
- Four feature cards in a masonry grid layout, each containing:
  - Icon in navy square (40x40px, rounded-xl).
  - Feature title (Nunito bold, primary-navy).
  - Feature description (Space Grotesk, text-muted).
- Cards use varied heights for visual interest (masonry pattern).
- Each card: rounded-2xl, glass morphism bg (bg-white/50 backdrop-blur-md), light border (border border-[#DEEAFB]/60).

#### User Interaction

- Feature cards are informational only — not interactive.
- No click targets or navigation from this section.
- Cards have hover effects: -translate-y-1, bg-white/75, shadow-xl (300ms ease-in-out).
- Keyboard users can Tab through cards if they become interactive in future.

#### Visual Intent

- Full-width section, py-24, px-6, max-width 1240px centered.
- Section badge pill at top, centered.
- Heading (h2) and subtitle centered below badge.
- 3-column masonry layout on desktop with varied card heights (taller and shorter cards mixed).
- 2-column grid on tablet, single column on mobile.
- Card internal padding: p-6 to p-8.
- Grid gap: gap-6.
- Icon in navy square (top-left of card).
- Title below icon, description below title.
- Hover: card lifts, background lightens, shadow intensifies.
- Cards may have subtle background color variations (bg-white/50, bg-white/60, bg-white/70) for depth.

#### Responsive Behavior

- **Mobile** (< 640px): Single column stack, all cards full-width.
- **Tablet** (640px - 1023px): 2-column grid. Cards maintain consistent or varied heights.
- **Desktop** (>= 1024px): 3-column masonry with varied card heights.
- **RTL**: Grid order mirrors. Icon placement and text alignment follow RTL rules.

#### Accessibility

- Section wrapped in `<section>` with `aria-labelledby` heading.
- Heading uses `<h2>` with unique ID.
- Feature cards use semantic structure (article or list item).
- Icons are decorative — marked `aria-hidden="true"`.
- Card titles serve as accessible names for each feature.
- Reduced motion: hover lift effects disabled.

#### States

- **Default**: All four feature cards visible in masonry grid.
- **Hover**: Card lifts (-translate-y-1), bg-white/75, shadow-xl.
- **Reduced motion**: Hover transitions disabled.

---

### Section 6: CTA (Call to Action)

#### Purpose

Deliver the final conversion push. After learning about the product, its workflow, and its features, the visitor is presented with a clear, compelling invitation to take action — create an account and begin their learning journey.

#### Content

- Section heading: "Ready to Synthesize Your AI Career Roadmap?" (Nunito extrabold, white text).
- Supporting description reinforcing the value proposition (Space Grotesk, slate/light gray text on dark bg).
- Primary CTA button: "Start Learning Free" (bg-primary-navy or bg-light-blue-bg, rounded-full, font-bold).
- Sub-text below CTA: "No credit card required" (small, muted text).
- Background: midnight-navy (#0A1930) with ambient blur glow.

#### User Interaction

- Clicking the CTA button navigates to the authentication page (or opens Roadmap Modal — placeholder behavior).
- The button is the sole interactive element in this section.
- Keyboard users can reach and activate the button.

#### Visual Intent

- Full-width section with midnight-navy (#0A1930) background.
- Ambient blur glow (decorative, low opacity) behind content for depth.
- Centered layout, max-width constraint.
- Heading: Nunito extrabold, white text, large display type.
- Description: Space Grotesk, slate/light gray text on dark bg.
- CTA button: primary styling (bg-primary-navy or light variant), rounded-full, generous padding, shadow-md.
- Sub-text: small, muted text below the button.
- Section padding: py-24, px-6.
- Creates visual bookend with Hero section (both dark navy).

#### Responsive Behavior

- **Mobile** (< 640px): Full-width centered layout. Heading scales down. Button full-width or nearly full-width.
- **Tablet** (640px - 1023px): Centered layout with moderate width constraint.
- **Desktop** (>= 1024px): Centered layout with max-width constraint. Button at natural size.
- **RTL**: Text alignment mirrors to right. Layout direction reverses.

#### Accessibility

- Section wrapped in `<section>` with `aria-labelledby` heading.
- Heading uses `<h2>` with unique ID.
- CTA button has descriptive accessible name.
- Visible focus ring on the button.
- Decorative blur glow marked `aria-hidden="true"`.
- Reduced motion: no animation concerns — static content.

#### States

- **Default**: Full CTA display on dark background.
- **Button hover**: Button lifts (-translate-y-0.5), shadow-lg.
- **Button focus**: Visible focus ring.
- **Button active**: Button snaps back (translate-y-0).
- **Reduced motion**: No change — minimal animations.

---

### Section 7: Footer

#### Purpose

Provide closing brand reinforcement, navigation links, and copyright information. The footer serves as a professional bookend to the page, confirming legitimacy and providing closure.

#### Content

- Brand logo and name ("AI Mentor") — terminal icon in navy square + text (Nunito extrabold).
- Navigation links: Privacy Policy, Terms of Service, Resource Trust Policy.
- Status indicator: "Status" with green pulsing dot.
- Copyright notice: "© 2025 AI Mentor Inc. Precision intelligence for human mastery."

#### User Interaction

- Navigation links navigate to corresponding pages (placeholder behavior).
- Status link navigates to status page (placeholder behavior).
- Links have hover effect: text-white on hover.

#### Visual Intent

- Full-width footer with midnight-navy (#0A1930) background.
- Horizontal layout: logo/brand on left, links in center, copyright on right.
- Top border for structural separation from CTA section.
- Logo and brand name use primary navy icon + white text.
- Links use slate/light gray text, transitioning to white on hover.
- Copyright uses muted text color.
- Generous vertical padding (py-12, px-6).
- Max-width 1240px centered.

#### Responsive Behavior

- **Mobile** (< 640px): Stacked vertically — brand on top, links centered, copyright below.
- **Tablet** (640px - 1023px): Horizontal layout begins.
- **Desktop** (>= 1024px): Full horizontal layout with generous spacing between logo, links, and copyright.
- **RTL**: Two-column layout mirrors — logo on right, links on left.

#### Accessibility

- `<footer>` landmark element.
- Logo image has appropriate `alt` text.
- Navigation links wrapped in `<nav>` with `aria-label="Footer navigation"`.
- Copyright text is plain text, no accessibility concerns.
- Reduced motion: no animation concerns.

#### States

- **Default**: Static footer display.
- **Link hover**: Text transitions to white.
- **Reduced motion**: No change — footer has minimal animations.

---

## Responsive Requirements

### Breakpoint Strategy

The Home Page must adapt fluidly across three primary breakpoint tiers:

- **Mobile**: Base styles, < 640px. Single-column layouts, stacked content, reduced padding.
- **Tablet**: >= 640px. Two-column layouts where appropriate, moderate spacing.
- **Desktop**: >= 1024px. Full layouts with generous spacing, max-width containers engaged.

### Layout Behavior

- All sections must use fluid width with max-width constraints — no fixed pixel widths for content containers.
- No horizontal overflow at any breakpoint.
- Text must wrap naturally without forced line breaks.
- Images and decorative elements must scale proportionally.
- Spacing (padding, margins, gaps) must scale between breakpoints using responsive utilities.

### Content Adaptation

- Headings scale down on smaller screens (responsive type scale).
- Grids collapse from multi-column to single-column on mobile.
- Two-column layouts stack vertically on mobile.
- Buttons may go full-width on mobile for easier touch targets.
- Decorative elements may be hidden or reduced on mobile for performance.

---

## RTL / LTR Requirements

### Bidirectional Layout

- The Home Page must render correctly in both Arabic (RTL) and English (LTR).
- Layout direction must be determined by the `dir` attribute on `<html>`.
- No layout assumptions should be based on left-to-right ordering.

### Mirroring Rules

- Navigation links mirror position (left ↔ right).
- Text alignment mirrors (left-aligned ↔ right-aligned).
- Timeline connectors mirror position (left edge ↔ right edge).
- Two-column layouts mirror column order.
- Icons that imply direction (arrows, chevrons) must be mirrored.
- Icons that are direction-neutral (targets, lightbulbs) must not be mirrored.

### Typography Adaptation

- Arabic text uses the Arabic font stack (IBM Plex Sans Arabic / Rubik) via existing CSS token switching.
- Letter-spacing is neutralized for Arabic (connected script).
- Line-height is increased for Arabic to accommodate taller x-height.
- Word spacing is added for Arabic readability.
- Text transforms (uppercase) are neutralized for Arabic.

### Spacing and Measurement

- `padding-inline` and `margin-inline` must be used instead of `padding-left`/`padding-right` for logical directional spacing.
- `border-inline-start`/`border-inline-end` must be used instead of `border-left`/`border-right`.
- `inset-inline-start`/`inset-inline-end` must be used instead of `left`/`right` for positioned elements.

---

## Internationalization Requirements

### Translation Coverage

- All user-facing text must be externalized to translation files via the existing `next-intl` architecture.
- No hardcoded English or Arabic strings in component code.
- Default fallback values in translation hooks are acceptable for development but must not appear in production.

### Translation Keys

The following translation namespaces/keys are required:

- `hero.title`, `hero.description`, `hero.cta`
- `howItWork.title`, `howItWork.subtitle`, `howItWork.step1.*` through `howItWork.step4.*`
- `features.heading`, `features.subheading`, `features.personalizedPlans.*`, `features.aiAnswers.*`, `features.progressTracking.*`, `features.smartFeedback.*`
- `cta.title`, `cta.description`, `cta.button`
- `footer.description`, `footer.copyright`, `footer.tagline`
- `aiLearningPath.*` (for the demo card)
- `metadata.title`, `metadata.description` (for page metadata)

### Locale Support

- Arabic (`ar`) and English (`en`) must be fully supported.
- The page must render correctly with either locale as the active language.
- Locale switching must update all visible text without page reload.

---

## Accessibility Requirements

### Semantic Structure

- Page uses appropriate HTML5 semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
- Heading hierarchy is maintained: one `<h1>` per page, `<h2>` for section headings, no skipped levels.
- Lists use `<ul>`/`<ol>` where appropriate.
- Interactive elements use `<button>` or `<a>` — not `<div>` with click handlers.

### Keyboard Accessibility

- All interactive elements are reachable via Tab key.
- Focus order follows visual reading order.
- Visible focus indicators on all interactive elements (using the existing `focus-ring` utility).
- Escape key closes the mobile navigation drawer.
- No keyboard traps anywhere on the page.

### Screen Reader Support

- All images have appropriate `alt` text or are marked decorative (`aria-hidden="true"`).
- Decorative elements (gradient glows, background effects) are marked `aria-hidden="true"`.
- Section headings are associated with their sections via `aria-labelledby`.
- Progress bars have `role="progressbar"` with appropriate ARIA attributes.
- Dynamic content changes are announced to screen readers where appropriate.

### Contrast

- All text meets WCAG AA contrast ratios against its background.
- Primary navy (#12314D) on white (#FFFFFF) exceeds 7:1 contrast.
- Muted text (#667085) on white (#FFFFFF) meets 4.5:1 contrast minimum.
- Focus indicators have sufficient contrast against all backgrounds.

### Reduced Motion

- All animations respect `prefers-reduced-motion: reduce`.
- Floating, fade-in, and scroll-driven animations are disabled or reduced.
- Content remains fully visible and functional without animations.
- The existing CSS `@media (prefers-reduced-motion: reduce)` rules apply.

### Touch Targets

- All interactive elements meet minimum 44x44px touch target size on mobile.
- Buttons have adequate padding for comfortable touch interaction.

---

## Performance Requirements

### Component Loading

- The Home Page should use Server Components where no client-side interaction is required.
- Client-side JavaScript should only be used for sections requiring interaction (Hero CTA, How It Works scroll animation, mobile navigation).
- The `HomePage` wrapper component is currently marked `"use client"` — this should be evaluated during implementation to minimize client-side JavaScript.

### Animation Performance

- Animations must use GPU-accelerated properties (transform, opacity) where possible.
- Scroll-driven animations must use `useScroll` from Framer Motion with appropriate throttling.
- No layout-triggering animations (width, height changes) on scroll.
- Floating animations must be lightweight CSS keyframes, not JavaScript-driven.

### Image and Asset Optimization

- No heavy image assets currently — section visuals are built with CSS, HTML, and gradients.
- Any future images must use Next.js Image component with appropriate sizing and lazy loading.
- Decorative gradients are CSS-only — no image assets.

### Bundle Impact

- No new dependencies should be introduced for the Home Page.
- Existing dependencies (Framer Motion, Lucide React) are already in the bundle.
- Section components should be code-split where practical.

---

## Interaction and State Requirements

### Global Interaction Patterns

- All buttons use the existing `btn-primary` / `btn-secondary` component patterns.
- All cards use the existing `card` utility pattern.
- Hover effects use the existing `hover-lift` utility for interactive cards.
- Focus indicators use the existing `focus-ring` utility.

### Section-Level States

Each section's applicable states are defined in its detailed specification above. The following summarizes interactive states across the page:

- **Navigation links**: default, hover, focus, active (aria-current).
- **CTA buttons**: default, hover, focus, active, disabled (if applicable).
- **Mobile menu toggle**: default, hover, focus, active (open/closed).
- **Feature cards**: default, hover (lift effect).
- **How It Works bento cards**: default, hover (subtle lift/emphasis).

### Loading States

- The Home Page is statically rendered — no loading states required for the initial page load.
- If dynamic content is added later (e.g., testimonials, live stats), appropriate skeleton/loading states must be defined.

### Error States

- The Home Page is statically rendered — no error states required for the initial specification.
- If API-dependent content is added later, error boundaries and fallback states must be defined.

---

## Reuse / Consistency Requirements

### Existing Components to Reuse

| Component               | Location                                      | Usage                          |
|------------------------|-----------------------------------------------|--------------------------------|
| Container              | `shared/components/ui/Container.tsx`          | All section content wrapping   |
| Button                 | `shared/components/ui/Button.tsx`             | CTA buttons                    |
| Card                   | `components/ui/card.tsx`                      | Feature cards, step cards       |
| SpecularButton         | `shared/components/ui/SpecularButton.tsx`     | Hero and CTA primary buttons   |
| FeatureCard            | `shared/components/ui/FeatureCard.tsx`        | Features section cards         |
| StepCard               | `shared/components/ui/StepCard.tsx`           | How It Works step cards        |
| HeadingReveal          | `shared/components/animations/HeadingReveal.tsx` | Heading animations         |
| FadeInView             | `shared/components/animations/FadeInView.tsx` | Fade-in animations             |
| TextReveal             | `shared/components/animations/TextReveal.tsx` | Text reveal animations         |
| ScrollStagger          | `shared/components/animations/ScrollStagger.tsx` | Scroll-triggered stagger  |
| MagneticBehavior       | `shared/components/animations/MagneticBehavior.tsx` | Button hover effect    |
| Card3D                 | `shared/components/animations/Card3D.tsx`     | 3D card effect                 |
| AnimatedProgressBar    | `shared/components/animations/AnimatedProgressBar.tsx` | Progress bars (if used)  |
| AnimatedNumber         | `shared/components/animations/AnimatedNumber.tsx` | Number animations (if used) |
| Logo                   | `shared/components/layout/navbar/Logo.tsx`    | Header and footer brand        |
| Navbar                 | `shared/components/layout/Navbar.tsx`         | Page header                    |
| Footer                 | `shared/components/layout/Footer.tsx`         | Page footer                    |

### Existing Utilities to Reuse

| Utility              | Purpose                                    |
|---------------------|--------------------------------------------|
| `glass-card`        | Frosted glass surface treatment            |
| `gradient-bg-brand` | Brand gradient background                  |
| `gradient-text`     | Gradient text for display headings         |
| `ai-glow`           | AI-active glow ring                        |
| `hover-lift`        | Lift-on-hover for cards                    |
| `focus-ring`        | Accessible focus indicator                 |
| `text-heading`      | Semantic heading typography                |
| `text-body`         | Semantic body typography                   |
| `text-label`        | Semantic label typography                  |
| `section-container` | Standard section content container         |
| `skeleton`          | Loading skeleton (if needed)               |

### Design Token Usage

All sections must consume design tokens from the existing `globals.css` system:

- Colors: `--color-primary-*`, `--color-accent-*`, `--color-secondary-*`, `--text-primary`, `--text-secondary`, `--text-muted`, `--surface-card`, `--border-default`.
- Typography: `--font-display`, `--font-body`, `--text-heading-*`, `--text-body-*`, `--text-caption`.
- Spacing: Use Tailwind spacing utilities, not custom values.
- Shadows: `--shadow-card`, `--shadow-floating`, `--shadow-hero`, `--shadow-focus`.
- Border radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`.

### No Competing Patterns

- Do not create new button variants that duplicate existing ones.
- Do not create new card components that duplicate existing patterns.
- Do not introduce a separate styling approach alongside the existing CSS system.
- Do not create new animation utilities that duplicate existing ones.

---

## Scope Boundaries

### In Scope

1. Global visual system replacement — navy/blue/purple palette becomes the project's primary visual system (tokens, Nunito font, 1240px container), with old teal/emerald tokens removed or repurposed and a mandatory cross-page audit.
2. Header (Navbar) updates for the Home Page context.
3. Hero section with dark navy presentation, dot grid pattern, headline, and dual CTAs.
4. How It Works section with asymmetric bento grid layout.
5. Features section with four feature cards.
6. CTA section with conversion-focused call to action.
7. Footer with brand reinforcement.
8. All responsive behavior across mobile, tablet, desktop.
9. Full RTL/LTR support for Arabic and English.
10. Accessibility compliance for all sections.
11. Internationalization of all user-facing text.

### Out of Scope

1. Backend API implementation or REST endpoint design.
2. Authentication flow changes (login, register, password reset).
3. Dashboard page modifications.
4. Onboarding flow changes.
5. Settings or profile page changes.
6. Global state management changes (Redux).
7. New dependency additions.
8. Routing architecture changes.
9. SEO optimization beyond basic page metadata.
10. Analytics or tracking implementation.
11. A/B testing infrastructure.
12. Content management system integration.
13. Performance optimization of unrelated pages.
14. Test infrastructure changes.

---

## Engineering Notes / Warnings

### Warning: Current Home Page Uses "use client"

The current `HomePage` component at `src/features/home/components/pages/home.tsx` is marked `"use client"`. This means the entire Home Page tree renders on the client, which is suboptimal for a mostly-static marketing page. During implementation, evaluate whether individual sections can be Server Components with client boundaries only where interaction is required (Hero CTAs, mobile navigation).

### Warning: Existing Color System vs. Design Reference

The existing `globals.css` uses a teal/emerald primary color system. The design reference specifies a navy/blue/purple system. Per user decision, the navy/blue/purple palette becomes the **project's primary visual system** — the teal/emerald tokens are removed or repurposed rather than kept alongside the new palette. This is a breaking change for any component consuming the old tokens (`bg-primary`, `text-primary`, `border-primary`, `--color-primary-*`, etc.). A cross-page audit (dashboard, onboarding, auth) is mandatory during Unit 1 implementation. If critical breakage is found, add a `--color-teal-*` alias set temporarily and remove it after migrating affected pages.

The Home Page now uses a mixed dark/light approach: Hero, CTA, and Footer use midnight-navy (#0A1930) backgrounds, while How It Works and Features use light surfaces (#FFFFFF, #EFF4FB). The Global Visual System must support both.

### Warning: Existing Navbar Is Minimal

The current Navbar at `src/shared/components/layout/Navbar.tsx` is a simple implementation with only Home and About links. The Home Page specification expects a more complete navigation structure. Implementation should extend the existing Navbar rather than replacing it, ensuring backward compatibility with other pages.

### Warning: Font System

The design reference specifies Nunito for headings/metrics and Space Grotesk for body/UI. The existing `globals.css` uses Space Grotesk as the primary display and body font. Font loading and token updates must be coordinated to support both font families without performance regression.

### Note: How It Works Layout Change

The How It Works section now uses an asymmetric bento grid layout instead of a vertical timeline with scroll-driven animation. The bento grid uses CSS Grid for layout with hover effects. Framer Motion may still be used for other animations but is no longer required for this section's scroll-driven timeline.

### Note: Translation Keys

All translation keys referenced in this specification must be added to both `messages/en.json` and `messages/ar.json` before the corresponding section is implemented. Translation content should be reviewed for accuracy and tone in both languages.

---

## Acceptance Criteria

### Section Structure

- [ ] All 7 sections are present in the correct order: Visual System, Header, Hero, How It Works, Features, CTA, Footer.
- [ ] Each section is implemented as an independent component.
- [ ] The `HomePage` component composes all sections in the correct order.
- [ ] No section is missing or combined with another section.

### Visual Hierarchy

- [ ] Headings use the primary navy color and display type scale.
- [ ] Body text uses muted/secondary text colors.
- [ ] CTA buttons are visually prominent and use primary navy styling.
- [ ] Hero, CTA, and Footer sections use midnight-navy (#0A1930) background.
- [ ] Content sections (How It Works, Features) alternate between white (#FFFFFF) and ice-blue (#EFF4FB).
- [ ] Decorative gradient glows and dot grid are present but subtle (low opacity, blurred).

### Responsive Behavior

- [ ] No horizontal overflow at any breakpoint (mobile, tablet, desktop).
- [ ] All sections adapt from single-column (mobile) to multi-column (desktop).
- [ ] Touch targets meet minimum 44x44px on mobile.
- [ ] Text scales appropriately between breakpoints.
- [ ] Generous spacing is maintained at all breakpoints.

### RTL/LTR

- [ ] Page renders correctly in English (LTR) without layout issues.
- [ ] Page renders correctly in Arabic (RTL) without layout issues.
- [ ] Navigation links mirror position in RTL.
- [ ] Text alignment follows direction in RTL.
- [ ] Bento grid and masonry layouts mirror order in RTL.
- [ ] Two-column layouts mirror column order in RTL.
- [ ] Arabic text uses the Arabic font stack with appropriate line-height and word-spacing.

### Accessibility

- [ ] Page uses semantic HTML5 elements (header, nav, main, section, footer).
- [ ] Heading hierarchy is maintained (one h1, h2 for sections, no skipped levels).
- [ ] All interactive elements are keyboard reachable.
- [ ] Visible focus indicators on all interactive elements.
- [ ] Mobile navigation has focus trap when open.
- [ ] Escape key closes mobile navigation.
- [ ] All decorative elements are marked `aria-hidden="true"`.
- [ ] Progress bar has appropriate ARIA attributes.
- [ ] All text meets WCAG AA contrast ratios.
- [ ] Reduced motion preference is respected (animations disabled).

### Internationalization

- [ ] All user-facing text is externalized to translation files.
- [ ] No hardcoded English or Arabic strings in component code.
- [ ] Translation keys exist for all visible text in both `en.json` and `ar.json`.
- [ ] Locale switching updates all visible text without page reload.

### Interaction Behavior

- [ ] CTA buttons navigate to the authentication page (or placeholder behavior).
- [ ] Mobile hamburger toggle opens/closes the navigation drawer.
- [ ] Mobile navigation links close the drawer after navigation.
- [ ] Header remains sticky during scroll.
- [ ] How It Works step cards have hover lift effect.
- [ ] Feature cards have hover lift effect.

### Component Reuse

- [ ] Existing Container, Button, Card, and animation components are reused.
- [ ] No duplicate button or card components are created.
- [ ] Design tokens from `globals.css` are consumed, not redefined.
- [ ] No new CSS utility classes that duplicate existing ones.

### Visual Identity Consistency

- [ ] Color palette matches the specified design reference (navy, blue, purple, surfaces).
- [ ] Typography follows the specified font pairing (Nunito headings, Space Grotesk body).
- [ ] Shadows are minimal and purposeful.
- [ ] Glassmorphism treatment is consistent across floating elements.
- [ ] Purple is used only for AI/progression states.

### No Unnecessary Changes

- [ ] No backend code is modified.
- [ ] No authentication flow is changed.
- [ ] No global architecture is changed.
- [ ] No new dependencies are added.
- [ ] No unrelated pages are modified.
- [ ] The specification is implemented as described without scope expansion.

---

## Assumptions

1. The existing `globals.css` design token system is the authoritative styling foundation. Per user decision, the navy/blue/purple palette becomes the project's primary visual system — the teal/emerald tokens are replaced or repurposed, not kept alongside. Cross-page audit and teal alias fallback apply as described in the Engineering Notes.
2. The existing component architecture (shared components, feature components, layouts) is the correct organizational pattern.
3. The existing `next-intl` setup is the correct internationalization approach.
4. The existing Framer Motion dependency is acceptable for scroll-driven animations.
5. The existing responsive breakpoint system (sm, md, lg, xl, 2xl, 3xl) is the correct approach.
6. The Hero section is a static visual presentation — not connected to real data.
7. The How It Works section's bento grid is static — content is fully accessible without animation.
8. The Header and Footer are shared components that may be used on other pages — changes must maintain backward compatibility.
9. Translation content quality and accuracy will be reviewed separately from the implementation.
10. The specification's color palette is the approved visual identity and should not be modified during implementation.
