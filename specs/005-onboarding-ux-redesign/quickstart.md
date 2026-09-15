# Quickstart: Onboarding UX Redesign (005)

**Branch**: `005-onboarding-ux-redesign` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md) | **Tests**: [../checklists/requirements.md](../checklists/requirements.md) → `tasks.md` (Phase 2)

How to run, validate, and manually smoke-test the redesigned **single-confirmation 6-step** onboarding (final order: Domain → Level → Time → Success Goal → Learning Preferences → Review/Confirmation; exactly **one** confirmation — step 6 — where the real submission fires). The earlier seven-step arrangement (with a Submit/Complete interstitial at step 5) is superseded — see spec.md Session 2026-09-14 duplicate-confirmation fix.

## Prerequisites

- Node.js + npm installed; dependencies installed (`npm install`).
- No environment variables are required for this feature (frontend-only, no backend, no `.env`).
- The app builds and serves (`npm run build` passes).

## Commands

| Task | Command | Expect |
|------|---------|--------|
| Dev server | `npm run dev` | App at `http://localhost:3000` |
| Lint | `npm run lint` | Pass (0 errors) |
| Build (typecheck + production build) | `npm run build` | Pass; onboarding page included |
| Preview | `npm run start` | Serves the production build |

## URLs

- `http://localhost:3000/en/onboarding` — English, LTR
- `http://localhost:3000/ar/onboarding` — Arabic, RTL
- `http://localhost:3000/en/dashboard` — dashboard (to verify post-onboarding redirect and roadmap empty state)

## Manual smoke scenarios

Each scenario maps to a success criterion (SC) and user story (US) from the spec.

### A. Layout and progress (US1, FR-001, FR-002, SC-001, SC-008)

1. **6-step progress bar** — Navigate to `/en/onboarding`. ProgressIndicator shows six dots; label reads "Step 1 of 6". First dot is active (primary colour). No layout overflow at 360px, 768px, 1280px.
2. **RTL** — `/ar/onboarding`: progress mirrors; labels translate; Arabic step titles and descriptions render correctly; no physical-direction leaks.
3. **Reduced motion** — Toggle `prefers-reduced-motion: reduce` (or use browser DevTools). Step transitions and progress bar animate without motion; no content is hidden.

### B. Step 1 — Domain (FR-006, FR-007, SC-001)

4. **Empty-domain validation** — On step 1, press Continue without typing → localized error appears ("Please enter what you'd like to learn to continue." / Arabic equivalent); step does not advance.
5. **Valid domain** — Type a domain (e.g., "Machine Learning", "Back-end Development") → Continue becomes clickable → pressing Continue advances to step 2; domain value is visible in the final Step 6 review later.
6. **No fixed list** — Confirm no dropdown, no autocomplete suggestions, no predefined chips exist; the field is a plain text input.

### C. Step 2 — Level (FR-008, SC-001)

7. **Three options render** — "Beginner", "Some experience", "Intermediate" all appear with descriptions; only one can be selected at a time.
8. **Continue gated** — Without selecting, Continue is disabled or shows error on press; after selecting one, Continue advances to step 3.
9. **Back works** — From step 2, press Back → returns to step 1; domain value is still present in the input field.

### D. Step 3 — Time commitment (FR-010, FR-011, SC-001)

10. **Five time options render** — "15–30 min", "30–60 min", "1–2 hrs/day", "Weekends only", "Custom".
11. **Custom sub-field** — Selecting "Custom" reveals an additional text input; submitting empty custom shows error; non-empty custom validates and advances to step 4.
12. **Continue gated** — No selection → error/advance-blocked; after selection → advance.

### E. Step 4 — Success goal (FR-012, SC-001)

13. **Free-text input** — Multiline text area renders; placeholder text mentions goals (e.g., "I want to become a Full-Stack Developer within 6 months...").
14. **Empty validation** — Empty + Continue → error; with text → advance to step 5 (Learning Preferences).

### F. Step 5 — Learning Preferences (FR-015, SC-003)

15. **Preferences multi-select** — Four OptionCards render (Hands-on, Video, Reading, Quizzes); toggling one on/off works; 2-col grid layout; ≥1 required to advance.
16. **Continue gated on preferences** — With zero selections, Continue is disabled or shows error on press; with ≥1 selected, Continue advances to step 6 (the single final review/confirmation).
17. **Back preserves answers** — From step 5, press Back → returns to step 4; the success goal is still present.

### F2. Single confirmation check (FR-001, FR-019)

18. **Exactly one confirmation in the flow** — Traverse the whole flow: no confirmation/summary screen appears before step 6. "Ready to Start" / `stepSixTitle` copy is never rendered anywhere.
18a. **Final summary shows every value** — Step 6 displays all four core values AND the Learning Preferences, each with its Edit action; preferences Edit returns to step 5.

### G. Step 6 — Final review / Submit / honesty states (FR-014, FR-016, FR-017, FR-018, FR-019, SC-004, SC-005, SC-006)

19. **Final review + Submit CTA visible** — Step 6 shows every collected value (4 core + Learning Preferences) with per-value Edit; a primary CTA button; Back button returns to step 5.
20. **Submitting state** — Click submit → CTA becomes disabled with a loading indicator/label ("Setting up your experience..."); Back is disabled during submission (no duplicate submit).
21. **Not-connected / error state** — Adapter resolves `not-connected` → error Card appears with localized message ("Onboarding submission is not available yet. Please try again later." / Arabic); "Retry" secondary button re-calls the boundary; step stays on step 6.
22. **Answers preserved on failure** — After error, press Back → step 5 shows all preferences unchanged; press forward to step 6 again → error state still renders (no fabricated success).
23. **No fabricated success** — At no point does `localStorage["ai-mentor-onboarding-complete"]` become `"true"` during this smoke session; `isComplete` is never set to `true`; the dashboard is never reached as a redirect target of this flow.

### H. Navigation correctness (FR-003, FR-004, FR-005, SC-002)

24. **Full forward flow** — Enter valid data at each of steps 1–5 → advance to step 6; progress bar updates at each step; progress dots correctly fill/unfill on forward/back navigation.
25. **Back navigation** — From every step (2–6), Back returns to the immediately previous step without losing any previously entered value.
26. **Progress reflects real position** — After going 1→2→3→2, progress bar shows step 2 active, dot 1 filled.

### I. i18n and a11y (SC-007, SC-008)

27. **All new strings translate** — Every newly added key renders in both English and Arabic without raw key names appearing; confirm via `/en/onboarding` and `/ar/onboarding`.
28. **Keyboard operability** — Tab through steps; focus-visible rings on buttons, OptionCards, and input fields; Enter/Space activates buttons; Step 6 (final) submit is focusable and activateable.
29. **Screen reader spot-check** — Error regions and headings have appropriate roles; `OptionCard` announces selection state; submit CTA announces loading state when applicable.

### J. Dashboard regression (SC-001 parity)

30. **Dashboard remains untouched** — Navigate to `/en/dashboard` while not complete (localStorage not set): dashboard shows its existing onboarding-empty state (CTA to `/onboarding`); no new errors in console.

## Regression checklist

- [ ] `onboardingSlice` field renames (`learningGoal`→`domain`, `skillLevel`→`level`) do not break the dashboard read (`dashboard-page.tsx:47` updated to `onboarding.domain`).
- [ ] `isGenerating` removal does not break any component (no residual `isGenerating` read or render branch anywhere).
- [ ] Simulated generation (`setTimeout` + `RoadmapGeneration` render branch) is gone; `RoadmapGeneration.tsx` still exists and is still importable.
- [ ] `localStorage["ai-mentor-onboarding-complete"]` is never written to `"true"` by any smoke scenario (only written on real future success, which is untestable today).
- [ ] `OnboardingLayout` receives `totalSteps={6}` (six dots rendered); no step-5 confirmation ("Ready to Start"/`stepSixTitle`) renders anywhere in the flow.
- [ ] Existing `(main)` layout (navbar + ShellBackground + Footer) still wraps the onboarding route.
- [ ] Devtools console shows no errors during any scenario A–J.
- [ ] `Backend/` contents unchanged (still `.gitkeep`).

## Validation order (narrow → broad)

1. `npm run lint`
2. `npm run build`
3. Manual scenarios A–J above

Tests: no dedicated unit/E2E runner is configured; the manual matrix above is the feature's test plan (`tasks.md` will break it into runnable steps). The boundary's `not-connected` behavior is verified by scenarios G-21/G-22. Success-path verification requires a future real adapter and is **NOT RUNNABLE TODAY** — this is an honest, documented gap (spec FR-019, contracts/onboarding-service.md §7).

## Known honest gaps (documented per Constitution VI)

- **Success E2E path**: unreachable until the API integration feature provides a real adapter. Scenario G-23 verifies the *absence* of fabricated success; the real success rendering is deferred.
- **Dashboard roadmap content**: `roadmap` stays `null`; dashboard renders the existing empty state. Real roadmap generation is out of scope for this feature.