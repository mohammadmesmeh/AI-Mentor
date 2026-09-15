---

description: "Task list for Home Page Ã¢â‚¬â€ Adaptive Intelligence redesign"

---

# Tasks: Home Page Ã¢â‚¬â€ Adaptive Intelligence Redesign

**Input**: Design documents from `/specs/001-home-page-specification/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not applicable Ã¢â‚¬â€ this is a static frontend-only marketing page with no business logic, no data model, and no API contracts. No automated component test framework is configured. Validation is manual visual review + `pnpm build` + the quickstart.md validation scenarios. The "Independent Test" of each user story is: build passes + `pnpm dev` visual check per the quickstart.md scenario for that unit.

**Organization**: Tasks are grouped by user story (6 independently implementable sections) after a Foundational phase (Global Visual System) that blocks all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1Ã¢â‚¬â€œUS6; Foundational phase has no story label)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js App Router project. All source under `src/`. Messages at repo root `messages/en.json`, `messages/ar.json`.
- All UI tokens live in `src/app/globals.css` (Tailwind v4 CSS-first config).
- Home sections live in `src/features/home/components/sections/`.
- Shared layout/UI/animation components live in `src/shared/components/`.

---

## Phase 1: Setup

**Purpose**: Confirm baseline build state before any changes.

> **Manual step (performed by the user, not an agent task)**: Run `pnpm build` from the repo root to establish a passing baseline build before implementation begins. The agent does NOT run Git operations, `pnpm install`, or the baseline build as part of the task list.

**Checkpoint**: Baseline build is green. No user story work can begin until Phase 2 (Foundational) is complete.

---

## Phase 2: Foundational Ã¢â‚¬â€ Global Visual System (Blocking Prerequisite)

**Purpose**: Replace the teal/emerald token system with the navy/blue/purple primary visual system (project-wide), add Nunito as the heading font, change the container width to 1240px, and add the `.dark-section` + dot-grid utilities. This is a BREAKING CHANGE for all pages consuming old tokens Ã¢â‚¬â€ a cross-page audit is mandatory.

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the homepage with navy tokens and Nunito headings; dashboard/onboarding/auth pages render without broken layouts (quickstart.md Scenario 1).

- [X] T001 Update `src/app/layout.tsx`: add Nunito via `next/font/google` (weights 600, 700, 800, 900); set `--font-display` to Nunito for LTR; keep/extend the `[dir="rtl"]` override pointing `--font-display` to IBM Plex Sans Arabic
- [X] T002 Replace primitive color tokens in `src/app/globals.css` `@theme` block: remove teal `--color-primary-*`, slate-mist `--color-secondary-*`, emerald `--color-accent-*`; add navy primary scale (#12314D), midnight (#0A1930), canvas (#FFFFFF), alt-bg (#EFF4FB), light-blue-bg (#DEEAFB), light-blue-text (#1D4E89), text-muted (#667085), success-green (#10B981), success-bg (#D1FAE5), live-red (#EF4444), accent-purple (#7C3AED)
- [X] T003 Update semantic theme variables and shadcn oklch vars in `src/app/globals.css` (`--text-primary`, `--text-secondary`, `--text-muted`, `--bg-base`, `--surface`, `--surface-card`, `--glass-bg`, `--glass-border`, `--primary`, `--secondary`, `--accent`, `--ring`) to match the new navy palette
- [X] T004 Replace `--container-content` from 72rem (1152px) to 77.5rem (1240px) and add `--container-hero` 63.75rem (1020px) in `src/app/globals.css`
- [X] T005 Add `.dark-section` utility (midnight-navy background, white text) and dot-grid background pattern utility in `src/app/globals.css`
- [X] T006 Update component utility classes (`.btn-primary`, `.badge-*`, `.card`, `.glass-card`) in `src/app/globals.css` to use the new navy/blue palette
- [X] T007 [P] Update `THEME_COLORS` in `src/shared/components/ui/SpecularButton.tsx` to the new navy palette (it currently hardcodes old teal hex values)
- [X] T008 Cross-page audit: grep `src/features/dashboard/`, `src/features/onboarding/`, `src/features/auth/`, and remaining `src/` for old teal token usage (`bg-primary`, `text-primary`, `border-primary`, `--color-primary-*`) and verify/migrate each usage against the new navy palette
- [X] T009 Remove old teal/emerald tokens from `src/app/globals.css` that are no longer referenced (after T008 audit); if critical breakage is found, instead add `--color-teal-*` alias tokens temporarily (removed in a follow-up task)
- [X] T010 Run `pnpm build` and verify `[dir="rtl"]` typography overrides (line-height, letter-spacing, word-spacing) still function; confirm RTL headings use IBM Plex Sans Arabic and LTR headings use Nunito

**Checkpoint**: Foundation ready Ã¢â‚¬â€ all user stories can now be implemented (sequentially or in parallel if staffed).

---

## Phase 3: User Story 1 Ã¢â‚¬â€ Header (Navbar) (Priority: P1) | MVP

**Goal**: Restyle the Navbar with glass morphism, a 1240px centered fixed layout, prototype-aligned nav links and CTAs, and a mobile hamburger dropdown.

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the Navbar as fixed-top glass morphism with nav links on tablet/desktop and a working hamburger dropdown on mobile; RTL mirrors (quickstart.md Scenario 2).

- [X] T011 [P] [US1] Update nav translation keys in `messages/en.json` (Home, Features, How It Works, Curriculum, Pricing, Sign In, Start Learning)
- [X] T012 [P] [US1] Update nav translation keys in `messages/ar.json` (Arabic equivalents for the same keys)
- [X] T013 [US1] Restyle the Navbar container in `src/shared/components/layout/navbar/Navbar.tsx`: fixed top, centered, max-width 1240px, glass morphism (`bg-white/40 backdrop-blur-xl`, border `#DEEAFB/50`), shadow `0 8px 32px -8px rgba(18,49,77,0.15)`
- [X] T014 [US1] Update nav link items and styling in `src/shared/components/layout/navbar/NavLinks.tsx` to the new link set; hidden on mobile, visible on tablet+
- [X] T015 [US1] Update CTAs and mobile behavior in `src/shared/components/layout/navbar/Navbar.tsx` + `src/shared/components/layout/navbar/MobileMenuButton.tsx`: "Sign In" (ghost/secondary) + "Start Learning" (primary navy); mobile hamburger opens a dropdown overlay with a condensed "Start" button; Escape closes it
- [X] T016 [US1] Add smooth scroll to anchor sections on link click and ensure accessibility in `src/shared/components/layout/navbar/Navbar.tsx`: `<header>` landmark, `<nav aria-label="Main navigation">`, toggle `aria-label`/`aria-expanded`, focus trap inside the mobile dropdown, skip navigation link

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 Ã¢â‚¬â€ Hero (Priority: P2) | MVP

**Goal**: Rewrite the Hero as a centered single-column dark navy presentation with a dot-grid pattern, ambient glow, Nunito headline, and dual CTAs.

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the dark midnight-navy Hero with dot grid, headline/subtitle/dual CTAs; CTA behavior matches the spec Ã‚Â§3 "User Interaction"; RTL mirrors; reduced-motion disables ambient animation (quickstart.md Scenario 3).

- [X] T017 [P] [US2] Update hero translation keys in `messages/en.json` (headline, subtitle, primary CTA "Generate Free Roadmap", secondary CTA "Explore Curriculums")
- [X] T018 [P] [US2] Update hero translation keys in `messages/ar.json` (Arabic equivalents for the same keys)
- [X] T019 [US2] Rewrite `src/features/home/components/sections/Hero.tsx`: centered single-column layout, midnight-navy (`#0A1930`) background with dot-grid pattern overlay and ambient blur glow, headline in Nunito extrabold (up to 56px white), subtitle in Space Grotesk, dual CTAs (primary navy rounded-full + light-blue-bg rounded-full), responsive padding (mobile pt-36/pb-20 text-4xl; desktop text-[56px] max-w 1020px)
- [X] T020 [US2] Wire CTA behavior and accessibility in `src/features/home/components/sections/Hero.tsx`: use ONLY the behavior defined in spec Ã‚Â§3 "User Interaction" Ã¢â‚¬â€ "Explore Curriculums" scrolls to the How It Works section (`#how-it-works`); the "Generate Free Roadmap" CTA keeps the existing placeholder behavior already in the current component (`router.push("/auth")`, the spec-defined "navigate to authentication" placeholder Ã¢â‚¬â€ do not invent a Roadmap Modal or new routes). Accessibility: `<section>` with `aria-labelledby` pointing to a unique-id `<h1>`; decorative dot grid and glow `aria-hidden="true"`; hover lift + active snap-back on CTAs; reduced-motion respects existing animation components (HeadingReveal/FadeInView)
- [X] T021 [US2] Remove the Hero usage of `AiLearningPathCard` per clarification (card is out of production scope). First verify usage across `src/` (only `src/features/home/components/sections/Hero.tsx` currently imports it). If it is used elsewhere after verification, remove only the Hero usage and leave the file; if unused anywhere, delete `src/features/home/components/sections/AiLearningPathCard.tsx` and its import from Hero

**Checkpoint**: User Story 2 fully functional and testable independently.

---

## Phase 5: User Story 3 Ã¢â‚¬â€ How It Works (Priority: P3)

**Goal**: Rewrite the How It Works section with an asymmetric bento grid using the 4 existing step cards.

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the asymmetric bento grid (4 cols desktop 2+1+1+2, 2 cols tablet, 1 col mobile) with 4 step cards, step-number watermarks, and hover lift; RTL grid mirrors; no interactive elements (informational only per clarification) (quickstart.md Scenario 4).

- [X] T022 [P] [US3] Update howItWork translation keys in `messages/en.json` (badge "Precision Learning Pipeline", heading, subtitle, 4 step titles + descriptions)
- [X] T023 [P] [US3] Update howItWork translation keys in `messages/ar.json` (Arabic equivalents for the same keys)
- [X] T024 [US3] Rewrite `src/features/home/components/sections/HowItWork.tsx`: asymmetric bento grid (CSS Grid, 2+1+1+2 on desktop, 2 cols tablet, 1 col mobile), pill badge, Nunito extrabold `<h2>`, subtitle, 4 step cards, section padding py-24/px-6 max-w 1240px; do NOT include sync button, adaptive toggle, or sandbox link
- [X] T025 [US3] Adapt `src/shared/components/ui/StepCard.tsx` for the bento layout: step-number watermark, icon in navy square (40x40px rounded-xl), Nunito bold title in primary-navy, Space Grotesk muted description, card style `rounded-2xl bg-white/50 backdrop-blur-md border-[#DEEAFB]/60`, hover `-translate-y-1 shadow-xl`
- [X] T026 [US3] Add accessibility and RTL handling in `src/features/home/components/sections/HowItWork.tsx` + `src/shared/components/ui/StepCard.tsx`: `<section>` with `aria-labelledby` heading, unique-id `<h2>`, decorative step numbers and icons `aria-hidden="true"`, grid order + text alignment mirror in RTL, hover effects disabled under reduced motion

**Checkpoint**: User Story 3 fully functional and testable independently.

---

## Phase 6: User Story 4 Ã¢â‚¬â€ Features (Priority: P4)

**Goal**: Rewrite the Features section with a 3-column masonry layout and 4 feature cards in the prototype's visual style.

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the masonry layout (3 cols desktop with varied heights, 2 cols tablet, 1 col mobile) with 4 feature cards and hover lift; RTL grid mirrors (quickstart.md Scenario 5).

- [X] T027 [P] [US4] Update features translation keys in `messages/en.json` (badge "Core Capabilities", heading, subtitle, 4 card titles + descriptions)
- [X] T028 [P] [US4] Update features translation keys in `messages/ar.json` (Arabic equivalents for the same keys)
- [X] T029 [US4] Rewrite `src/features/home/components/sections/Features.tsx`: 3-column masonry layout (CSS grid with varied card heights on desktop, 2 cols tablet, 1 col mobile), pill badge, Nunito extrabold `<h2>`, subtitle, 4 feature cards (Personalized Learning Plans / AI-Powered Assistance / Progress Tracking / Smart Feedback), section padding py-24/px-6 max-w 1240px
- [X] T030 [US4] Adapt `src/shared/components/ui/FeatureCard.tsx` for masonry: icon in navy square (40x40px rounded-xl), Nunito bold title in primary-navy, Space Grotesk muted description, card style `rounded-2xl bg-white/50 backdrop-blur-md border-[#DEEAFB]/60`, hover `-translate-y-1 shadow-xl`, Lucide icons (Target, Bot, TrendingUp, Lightbulb)
- [X] T031 [US4] Add accessibility and RTL handling in `src/features/home/components/sections/Features.tsx` + `src/shared/components/ui/FeatureCard.tsx`: `<section>` with `aria-labelledby` heading, unique-id `<h2>`, icons `aria-hidden="true"`, card titles serve as accessible names, grid order + text alignment mirror in RTL, hover effects disabled under reduced motion

**Checkpoint**: User Story 4 fully functional and testable independently.

---

## Phase 7: User Story 5 Ã¢â‚¬â€ CTA (Priority: P5)

**Goal**: Rewrite the CTA section with a midnight-navy background and centered single-column layout (no telemetry dashboard).

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the dark navy centered CTA with heading, description, "Start Learning Free" button, and "No credit card required" sub-text; RTL mirrors (quickstart.md Scenario 6).

- [X] T032 [P] [US5] Update cta translation keys in `messages/en.json` (heading, description, CTA "Start Learning Free", sub-text "No credit card required")
- [X] T033 [P] [US5] Update cta translation keys in `messages/ar.json` (Arabic equivalents for the same keys)
- [X] T034 [US5] Rewrite `src/features/home/components/sections/CTA.tsx`: midnight-navy (`#0A1930`) background, centered single-column layout, decorative ambient blur glow, Nunito extrabold `<h2>` in white, Space Grotesk description, primary rounded-full CTA with hover lift + active snap-back, muted sub-text, responsive (button full-width on mobile, natural size on desktop); do NOT include the telemetry dashboard

**Checkpoint**: User Story 5 fully functional and testable independently.

---

## Phase 8: User Story 6 Ã¢â‚¬â€ Footer (Priority: P6)

**Goal**: Rewrite the Footer with a midnight-navy background and horizontal layout (logo | links | copyright).

**Independent Test**: `pnpm build` passes; `pnpm dev` shows the dark navy footer with horizontal layout on desktop (stacked on mobile), 4 links with hover state, and copyright; RTL layout mirrors (quickstart.md Scenario 7).

- [X] T035 [P] [US6] Update footer translation keys in `messages/en.json` (link labels Privacy Policy, Terms of Service, Resource Trust Policy, Status; copyright text)
- [X] T036 [P] [US6] Update footer translation keys in `messages/ar.json` (Arabic equivalents for the same keys)
- [X] T037 [US6] Rewrite `src/shared/components/layout/Footer.tsx`: midnight-navy (`#0A1930`) background, horizontal layout with logo left, links center, copyright right (stacked vertically on mobile, horizontal on tablet+), top border for structural separation, padding py-12/px-6 max-w 1240px, logo + "AI Mentor" in Nunito extrabold
- [X] T038 [US6] Add link behavior and accessibility in `src/shared/components/layout/Footer.tsx`: render the 4 links (Privacy Policy, Terms of Service, Resource Trust Policy, Status with green dot) with hover state (white text), links in `<nav aria-label="Footer navigation">`, `<footer>` landmark, logo alt text. Use ONLY placeholder link destinations consistent with spec Ã‚Â§7 "User Interaction" (navigation links and status link use placeholder behavior). Do NOT invent routes or external URLs Ã¢â‚¬â€ reuse the existing `Link` from `@/i18n/navigation` with verified in-app destinations where a page exists, and `"#"` placeholders otherwise, exactly per the project's existing footer/link patterns

**Checkpoint**: User Story 6 fully functional and testable independently.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation that affect multiple user stories.

- [X] T039 [P] Run quickstart.md validation scenarios 1Ã¢â‚¬â€œ9 (build + dev + full-page integration + cross-page regression) and record results in the implementation report
- [X] T040 [P] Final cross-page sweep: `grep -r "color-primary\|1ea28c\|22ad84\|64827e" src/` Ã¢â‚¬â€ verify no stale teal/emerald hex values remain in components; confirm `src/features/dashboard/`, `src/features/onboarding/`, `src/features/auth/` render correctly with the new palette
- [X] T041 [P] Performance check: verify Nunito loads only needed weights with `display: swap`; run Lighthouse on the homepage and confirm no meaningful performance regression
- [X] T042 [P] Final diff review against plan.md acceptance criteria: confirm only intended files changed, no debug code/temp files/secrets, no scope expansion, and RTL/LTR + reduced-motion behaviors verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Manual baseline-build step by the user (no agent tasks).
- **Foundational (Phase 2)**: BLOCKS all user stories (they consume the new tokens/font/container).
- **User Stories (Phase 3+ Ã¢â‚¬â€ US1 Header, US2 Hero, US3 How It Works, US4 Features, US5 CTA, US6 Footer)**: All depend on the Foundational phase. Each is independently implementable once Phase 2 is complete.
- **Polish (Phase 9)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 Header (P1)**: No dependencies on other stories (requires Phase 2 only).
- **US2 Hero (P2)**: No dependencies on other stories (requires Phase 2 only).
- **US3 How It Works (P3)**: No cross-story dependencies. Uses the shared `StepCard` component only.
- **US4 Features (P4)**: No cross-story dependencies. Uses the shared `FeatureCard` component only.
- **US5 CTA (P5)**: No cross-story dependencies.
- **US6 Footer (P6)**: No cross-story dependencies. Shares translation files (`messages/*.json`) and the `Logo` component with US1 Ã¢â‚¬â€ coordinate edits to avoid conflicts.

### Within Each User Story

- Translation keys (`messages/en.json` + `messages/ar.json`) are handled first (marked [P] Ã¢â‚¬â€ different files, no conflict).
- Then the section component rewrite, then shared card-component adaptation, then accessibility/RTL verification.
- Story complete before moving to the next priority.

### Parallel Opportunities

- Phase 2: T007 ([P], different file SpecularButton.tsx) can run in parallel with the globals.css tasks (T001Ã¢â‚¬â€œT006, T008Ã¢â‚¬â€œT010 sequential on the same files).
- Each user story's two translation tasks can run in parallel (different files).
- Once the Foundational phase completes, all 6 user stories could start in parallel if staffed independently Ã¢â‚¬â€ BUT note shared files: US1/US6 share `messages/*.json` and `Logo.tsx`; US3/US4 touch different shared UI components (StepCard vs FeatureCard). Prefer the sequential order in the Implementation Strategy to follow the plan's STOP-review-after-each-unit workflow.
- Polish [P] tasks can run in parallel.

---

## Parallel Example: User Story 2 (Hero)

```bash
# Translation keys (different files, no conflicts):
Task: "Update hero translation keys in messages/en.json"
Task: "Update hero translation keys in messages/ar.json"

# Then sequentially (same component file):
Task: "Rewrite src/features/home/components/sections/Hero.tsx"
Task: "Wire CTA behavior and accessibility in src/features/home/components/sections/Hero.tsx"
```

---

## Implementation Strategy

### MVP First (Foundation + US1 Header + US2 Hero)

1. Complete Phase 1: Setup (manual baseline build by the user).
2. Complete Phase 2: Foundational (Global Visual System) Ã¢â‚¬â€ CRITICAL, blocks all stories.
3. Complete Phase 3: US1 Header Ã¢â€ â€™ build Ã¢â€ â€™ manual review.
4. Complete Phase 4: US2 Hero Ã¢â€ â€™ build Ã¢â€ â€™ manual review.
5. **STOP and VALIDATE**: The Home Page will render with a correct visual foundation, nav, and hero.

### Incremental Delivery

1. Complete Setup + Foundational Ã¢â€ â€™ Foundation ready.
2. Add US1 Header Ã¢â€ â€™ build + quickstart.md Scenario 2 Ã¢â€ â€™ STOP for review.
3. Add US2 Hero Ã¢â€ â€™ build + quickstart.md Scenario 3 Ã¢â€ â€™ STOP for review.
4. Add US3 How It Works Ã¢â€ â€™ build + quickstart.md Scenario 4 Ã¢â€ â€™ STOP for review.
5. Add US4 Features Ã¢â€ â€™ build + quickstart.md Scenario 5 Ã¢â€ â€™ STOP for review.
6. Add US5 CTA Ã¢â€ â€™ build + quickstart.md Scenario 6 Ã¢â€ â€™ STOP for review.
7. Add US6 Footer Ã¢â€ â€™ build + quickstart.md Scenario 7 Ã¢â€ â€™ STOP for review.
8. Polish phase: full integration + cross-page regression (quickstart.md Scenarios 8Ã¢â‚¬â€œ9).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Then assign one-story-per-developer (US1Ã¢â‚¬â€œUS6) since each is independent after the Foundational phase.
3. Coordinate shared files: only US1/US6 overlap (`messages/*.json`, `Logo.tsx`) and US3/US4 each touch their own shared UI card.

---

## Notes

- This feature makes a project-wide breaking visual change (teal Ã¢â€ â€™ navy primary tokens, font change, container width change). The cross-page audit in T008 and the final sweep in T040 are mandatory, not optional.
- Git operations, `pnpm install`, and the baseline build are NOT agent tasks Ã¢â‚¬â€ the baseline build is a manual user step (Phase 1).
- [P] tasks = different files, no dependencies.
- [Story] label maps the task to the specific user story for traceability.
- Follow the STOP-review-after-each-unit workflow from plan.md; never batch multiple user stories into one review.
- Commit after each task or logical group.
- The Feature is complete only when quickstart.md validation scenarios pass and the final diff matches plan.md's acceptance criteria.
