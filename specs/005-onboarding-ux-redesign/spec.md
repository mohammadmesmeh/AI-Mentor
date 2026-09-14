# Feature Specification: Onboarding UX Redesign (Single-Confirmation Flow)

**Feature Branch**: `005-onboarding-ux-redesign`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Design and specify the Frontend UI/UX for the AI Mentor Onboarding flow. This phase is specification only." The onboarding consists of exactly six steps with **one** confirmation: 1- المجال Learning Domain → 2- المستوى Current Level → 3- الوقت Available Learning Time → 4- هدف النجاح Success Goal → 5- Learning Preferences → 6- التأكيد Review/Confirmation (the single, final confirmation; the real submission fires here).

## Clarifications

### Session 2026-09-13

- Q: In the first step (المجال), should the user provide a learning-domain category, a free-text goal, or both? → A: A free-text learning domain only — any subject the user wants to study (e.g. React, Backend, Python, English, Design, Marketing, or another area). No separate "learning goal" field is added to Step 1; the domain and the success goal (Step 4) are separate concepts; the product-requirements categories act as reference examples, not a fixed list, and the AI interprets the entered domain to personalize the experience.
- Q: Should learning preferences remain part of the onboarding flow? → A: Yes — collected within Step 5 (Review / Confirmation) as a multi-select. The flow stays exactly six steps; no seventh step is added; at least one preference is required before advancing to submission.
- Q: After a successful submission (step 6), where should the user go next? → A: Show a brief success confirmation, then proceed directly to the roadmap creation/generation experience. No redirect to the dashboard before generation and no success-only screen; the generation flow itself is outside this spec's scope.

### Session 2026-09-14

- The onboarding flow is corrected from six to seven steps in this **final approved order**: 1- Learning Domain → 2- Current Level → 3- Available Learning Time → 4- Success Goal → 5- Submit/Complete → 6- Learning Preferences → 7- Review/Confirmation. Learning Preferences is a **dedicated** step (not merged into Review, not moved anywhere else). Step 7 (Review/Confirmation) is the final step: it summarizes all collected information, allows review/edit before final completion, and is where the **real submission fires**. Step 5 (Submit/Complete) confirms the four core answers in a read-only summary and advances to Step 6 — it must **not** call the submission boundary. The submitted `OnboardingData` still contains all fields including `learningPreferences`, and the API contract is unchanged. This supersedes the six-step clarification from Session 2026-09-13.
- **Duplicate-confirmation fix (same day, supersedes the bullet above).** The 7-step arrangement above produced **two confirmation screens** — a core-answer confirmation on Step 5 plus the final review on Step 7 — which reads as a duplicated confirmation before and after Learning Preferences. The pre-preferences confirmation is removed. The flow is now exactly six steps with **one** confirmation: 1- Learning Domain → 2- Current Level → 3- Available Learning Time → 4- Success Goal → 5- Learning Preferences (≥1 required) → 6- Review/Confirmation (the single, final confirmation: summary of every value with Edit actions, plus the real submission). No submission fires before Step 6. `OnboardingData`, the API contract, validation, step components, and preferences are unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete the core onboarding journey (Priority: P1)

An Arabic or English user who has just signed in lands on the onboarding flow and completes all six steps in order: they enter a learning domain, pick their current level, choose how much time they can commit, write their success goal, pick their preferred learning methods (step 5), and submit on the single final review/confirmation (step 6). At every data step the user understands what is being asked, what is entered/selected, and what happens next; Continue is only available once the required input is valid. The user may go Back at any time from step 2 onward and never loses answers they already entered.

**Why this priority**: This is the primary product funnel (sign in → onboard → learn). Without a valid, completable onboarding flow the user cannot reach the roadmap. It is the first slice to build and validate.

**Independent Test**: Can be fully tested by starting onboarding with a fresh session, completing all six steps without ever going back, and confirming a successful submission at the end.

**Acceptance Scenarios**:

1. **Given** a fresh authenticated user on step 1, **When** they enter a learning domain, **Then** the entered value is visible and Continue becomes enabled.
2. **Given** a user on a data step with no valid input, **When** they press Continue, **Then** a localized inline error is shown and they do not advance.
3. **Given** a user on step 6, **When** they confirm submission, **Then** a loading state is shown, followed by either a clear success confirmation or a clear error with retry — never a fabricated success.

---

### User Story 2 - Review and correct answers before submitting (Priority: P1)

Before submitting, the user completes their learning preferences (step 5) and reviews the single final summary (step 6) of the collected values: Learning Domain, Current Level, Available Learning Time, Success Goal, and Learning Preferences. Each value has an obvious "edit" action that takes the user back to that value's step with every answer preserved. The user can correct one or more values, return forward through the flow, and confirm the review summary reflects the corrected values before submitting on step 6.

**Why this priority**: This guarantees data quality before the roadmap is built and is the key trust signal the review step is designed for. It is only meaningful if answers persist, so it also validates state persistence.

**Independent Test**: Can be fully tested by entering answers, navigating to the review step, editing each core value in turn via its edit action, and confirming each edit is reflected in the summary.

**Acceptance Scenarios**:

1. **Given** a user who has completed all data steps, **When** they reach the review step, **Then** the summary shows all four core values exactly as last entered.
2. **Given** a review summary, **When** the user chooses the edit action for any core value, **Then** they land on that value's step with the previous answer still selected/entered.
3. **Given** a corrected value, **When** the user returns to the review step, **Then** the summary shows the new value and no other value changed.

---

### User Story 3 - Complete onboarding on mobile, tablet, and desktop in RTL and LTR (Priority: P2)

The same six-step flow is fully usable on small phones, tablets, and desktop screens, in Arabic (RTL) and English (LTR). Options remain easy to read and tap/click, spacing and typography follow the existing design tokens, there is no horizontal scrolling, and the progress indicator stays understandable at every size.

**Why this priority**: Arabic/English and mobile/tablet/desktop are first-class product requirements (Reqs §37, Constitution VIII). A flow that breaks on a phone or in RTL would exclude a large share of users, so correctness here is nearly as critical as the main journey.

**Independent Test**: Can be fully tested by completing the flow at representative mobile, tablet, and desktop widths in both locales and confirming no overflow, usable touch targets, and correct RTL/LTR mirroring.

**Acceptance Scenarios**:

1. **Given** a viewport at least 360px wide, **When** the user completes the flow in Arabic, **Then** no content overflows horizontally and all controls meet the minimum touch-target size.
2. **Given** the English locale, **When** the user completes the flow, **Then** all labels, errors, and buttons are in English and the layout reads left-to-right.
3. **Given** the Arabic locale, **When** any step is rendered, **Then** the interface and all logical properties mirror correctly right-to-left.

---

### User Story 4 - Complete onboarding with keyboard and assistive technology only (Priority: P3)

A user navigating with the keyboard only can reach and operate every option and control, always sees a visible focus indicator, and gets clear, correctly-labeled feedback. A screen-reader user receives step context, selection state, and validation errors without ambiguity. Reduced-motion preferences neutralize all non-essential motion.

**Why this priority**: Reuse of the existing accessibility baseline (focus ring, reduced-motion, WCAG AA contrast) is required by the Constitution and the existing design system; it is lower risk than the core journeys but must not regress them.

**Independent Test**: Can be fully tested by completing all six steps using keyboard only (no pointer) with a visible focus indicator at every step, and by reviewing the flow with a screen reader and reduced-motion enabled.

**Acceptance Scenarios**:

1. **Given** keyboard-only navigation, **When** the user tabs through any step's options, **Then** every option receives a visible focus indicator and can be selected with the keyboard.
2. **Given** a step with an error, **When** the error is triggered, **Then** the message is presented in proximity to the control and announced to assistive technology.
3. **Given** the reduced-motion setting, **When** any step transitions or loads, **Then** no non-essential animation or motion is played.

---

### User Story 5 - Recover from a failed submission (Priority: P3)

If submission fails (for example, the service is temporarily unavailable), the user sees a clear, non-technical, localized error that does not lose any entered answer, and a retry option that re-attempts submission without re-entering anything. If the user attempts submission more than once, they cannot accidentally submit the same onboarding twice.

**Why this priority**: Submission failure is a real failure mode (Constitution VI, IX). Handling it honestly — never a fake success — protects data integrity and user trust. It is a smaller slice but a required one.

**Independent Test**: Can be fully tested by simulating a failed submission, confirming the error state and preserved answers, then retrying and confirming success.

**Acceptance Scenarios**:

1. **Given** a failed submission, **When** the user sees the error state, **Then** all previously entered answers are still present.
2. **Given** the error state, **When** the user chooses retry, **Then** the submission is attempted again without the user re-entering answers.
3. **Given** a submission in progress, **When** the user triggers submit again (double-click or rapid tap), **Then** only one submission is attempted.

---

### Edge Cases

- What happens if the user presses Continue on a step with no valid required input? → Advancement is blocked; a localized inline error is shown and cleared when the input becomes valid.
- What happens if the user enters a learning domain that is not in the product-requirements category list? → It is accepted; that list is a reference example, not a restriction on the free-text domain.
- What happens if the user navigates Back and then forward again? → All previously entered answers are preserved; the user never re-enters data already given.
- What happens if step 3's custom-time option is selected but left empty? → The user is blocked with a specific message asking for a description of their availability.
- What happens at step 5 if no learning preference is selected? → The user is blocked from advancing to step 6 with a localized message asking to choose at least one preference.
- What happens if the submission request is in flight and the user presses Back or Submit again? → The submit action is disabled while in flight; no duplicate submission occurs.
- What happens if a browser refresh occurs partway through the flow? → In-progress answers are retained from the client session so the user does not start from zero. (Full persistence behavior of a reload is defined in an assumption below.)
- What happens if the success goal is very long? → The input accepts the defined maximum, wraps without breaking layout, and the review step displays it without overflow.
- What happens in RTL with long Arabic text? → Text wraps and mirrors correctly; no clipping or horizontal overflow (reuse existing Arabic type adjustments).
- What happens with reduced-motion enabled? → Step transitions and loaders collapse to instant/settled states; decorative motion is suppressed by the existing global rule.
- What happens if the service is unavailable at submission time? → A localized error state with preserved answers and retry; never a fabricated success.
- What happens immediately after a successful submission? → A brief success confirmation is shown, then the user proceeds directly to the roadmap creation/generation experience; no dashboard redirect and no success-only stop.

## Requirements *(mandatory)*

### Functional Requirements

**Flow structure & navigation**

- **FR-001**: The system MUST present exactly six onboarding steps in this order: 1- المجال Learning Domain, 2- المستوى Current Level, 3- الوقت Available Learning Time, 4- هدف النجاح Success Goal, 5- Learning Preferences, 6- التأكيد Review/Confirmation. The flow contains exactly **one** confirmation (step 6); there MUST NOT be any confirmation or submit screen before Learning Preferences. No additional onboarding steps MAY be added and no step MAY be reordered, merged, or moved unless existing product requirements explicitly require them.
- **FR-002**: The system MUST show a persistent progress indicator on every step that communicates the current step, the completed steps, and the remaining steps (for example "Step X of 6" with filled/active/remaining segments, localized).
- **FR-003**: The system MUST allow the user to go Back from any step from step 2 onward, and to Continue to the next step. Continue MUST be disabled until the current step's required input is valid. Back MUST NOT discard any answer already entered.
- **FR-004**: The system MUST require valid required input before advancing from each step that collects input (steps 1-4, and the preference selection on step 5). Missing or invalid input MUST block advancement and show a clear, localized message near the relevant control; the message MUST clear as soon as the input becomes valid.
- **FR-005**: The system MUST preserve all entered answers whenever the user navigates backward or forward within the flow, including after edits made from the review step, so the review summary always reflects the latest values.

**Step 1 — Learning Domain (المجال)**

- **FR-006**: Step 1 MUST show a clear heading, a short supporting description, and a free-text input where the user enters the learning subject they want to study (e.g. React, Backend, Python, English, Design, Marketing, or another area). The entered value MUST remain visible as the user proceeds, and Continue MUST remain disabled until a non-empty value is provided.
- **FR-007**: The domain input MUST NOT be artificially restricted to a fixed list. The product-requirements categories (Programming, Design, Marketing, Languages, Business, Career switching, Skill development, Other — Reqs §2) serve as reference examples only. The AI interprets the user's entered domain to personalize the learning experience. The domain (Step 1) and the success goal (Step 4) are separate concepts; NO separate free-text "learning goal" field is added to Step 1.

**Step 2 — Current Level (المستوى)**

- **FR-008**: Step 2 MUST explain what "current level" means in plain language, present selectable level options with a clear selected state and accessible interaction, and block Continue until a level is selected.
- **FR-009**: The level options MUST reuse the levels already defined for the product (the current UI presents Beginner, Some experience, and Intermediate with short descriptions, matching the level values in the learning-profile contract). The exact option values and their storage are owned by the API contract and MUST NOT be redefined by this spec.

**Step 3 — Available Learning Time (الوقت)**

- **FR-010**: Step 3 MUST present simple, easily comparable time choices with a clear selected state, whole-option touch targets on mobile, and must block Continue until a choice is made.
- **FR-011**: The time choices MUST reuse the options already defined in the current onboarding (15-30 minutes a day, 30-60 minutes a day, 1-2 hours a day, weekends only, custom). If the custom option is chosen, the user MUST provide a non-empty description before continuing. The exact numeric interpretation of these choices (for example weekly minutes) belongs to the API contract and is out of scope here.

**Step 4 — Success Goal (هدف النجاح)**

- **FR-012**: Step 4 MUST collect the user's success goal. Consistent with the current implementation and the learning-profile contract (which describe this as a free-text outcome), the input MUST be free text with a helper, placeholder, and non-empty validation before Continue. The exact maximum length and payload are owned by the API contract.

**Step 5 — Learning Preferences**

- **FR-015**: Step 5 MUST be a dedicated onboarding step that collects the user's learning preferences as a multi-select from the product-defined set (hands-on learning, video, reading, quizzes — matching the current onboarding and the learning-profile contract's preferred learning methods). At least one preference MUST be selected; the user MUST NOT advance from Step 5 to Step 6 until at least one preference is chosen.

**Step 6 — Review / Confirmation (التأكيد)**

- **FR-014**: Step 6 MUST present the single final review/confirmation: a summary of every collected value — the four core values and Learning Preferences — each with an obvious edit action that navigates to that value's step (Domain → 1, Level → 2, Time → 3, Goal → 4, Preferences → 5) with all answers preserved. After an edit the user MAY return through the flow to review, and the summary MUST show the corrected values.
- **FR-016**: Step 6 MUST present a final, localized primary CTA for submission. The CTA MUST be disabled while a submission is in flight. During submission the CTA MUST reflect a loading state and MUST prevent duplicate submissions (rapid taps/double-click, or Back + Submit concurrently).
- **FR-017**: On success, the system MUST show a brief, clear confirmation that the onboarding answers were saved, followed by a transition into the roadmap creation/generation experience. The user MUST NOT be redirected to the dashboard before the roadmap-generation flow begins, and MUST NOT remain on a success-only screen. The roadmap-generation flow itself is outside this spec's scope.
- **FR-018**: On failure, the system MUST show a clear, localized, non-technical error that preserves all entered answers and offers a retry that re-attempts submission without re-entering answers. Diagnostic identifiers (such as a request ID) MUST NOT be presented as the primary user message.
- **FR-019**: Submission success, failure, and loading states MUST reflect the real outcome of the submission. The system MUST NEVER show a fabricated success, simulated delay, or fake data. No submission MAY be triggered from any step before step 6.

**Responsive layout & internationalization**

- **FR-020**: The flow MUST be fully usable on mobile, tablet, and desktop. On small screens the layout MUST be a single scrollable column with no horizontal overflow; on larger screens a comfortable centered content column with responsive spacing. Controls MUST meet the project's minimum touch-target size on all supported widths.
- **FR-021**: The flow MUST work correctly in Arabic (RTL) and English (LTR), reusing the existing direction handling, font switching, and logical-property mirroring. All user-facing strings MUST be localized.

**Accessibility**

- **FR-022**: Every step MUST be fully operable with the keyboard only: all options focusable, logical tab order, no keyboard trap, selection and activation via standard keys.
- **FR-023**: Keyboard users MUST always see a visible focus indicator on the focused element, reusing the existing focus treatment.
- **FR-024**: Controls MUST convey correct semantics to assistive technology (selection state, step identity, heading structure), and step changes MUST be announced appropriately.
- **FR-025**: Validation errors MUST be localized, specific, positioned near the related control, and announced to assistive technology.
- **FR-026**: Text and background contrast MUST meet WCAG AA using the existing semantic tokens.

**Motion**

- **FR-027**: Motion MUST respect the standard reduced-motion setting; with it enabled, no non-essential animation or transition plays. Animations otherwise MUST be subtle and functional only, reusing existing easing and animation utilities, WITHOUT introducing new animation dependencies.

**Visual consistency & reuse**

- **FR-028**: The flow MUST reuse the existing AI Mentor visual language — design tokens, spacing, typography, radius, buttons, cards, and existing maximize-like step components and patterns — and MUST NOT introduce a competing UI library.
- **FR-029**: The implementation MUST NOT redesign unrelated pages, the global design system, or global styles. Only the onboarding flow and its supporting states are in scope.

### Key Entities *(feature involves data)*

- **Learning Domain**: The learning subject the user wants to study, entered as free text (any valid subject area, e.g. React, Backend, Python, English, Design, Marketing, or another area); shapes the subject area of the roadmap.
- **Current Level**: The user's self-assessed level of existing knowledge, one of the three defined levels; used to meet the user where they are.
- **Available Learning Time**: The user's chosen time commitment (one of the defined options or a custom description); used to set the roadmap pace. The exact numeric interpretation belongs to the API contract.
- **Success Goal**: The user's own free-text definition of success (their desired outcome); used as the target the roadmap is built toward.
- **Learning Preferences**: The user's preferred learning methods, chosen as a multi-select during Step 5 (at least one required); used for roadmap personalization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of test journeys that reach step 1 can complete all six steps to a successful submission without re-entering any answer already provided.
- **SC-002**: A user on a normal connection can complete onboarding from step 1 through submission in under 4 minutes.
- **SC-003**: 100% of steps that collect input (steps 1-4 and the Step 5 preference selection) block advancement until the required input is valid.
- **SC-004**: Across all test scenarios, the review summary (step 6) matches the last-entered answers in 100% of cases, including immediately after edits made from the review step.
- **SC-005**: Using only the keyboard, every control is operable and every focused element has a visible focus indicator across all six steps.
- **SC-006**: The flow renders without horizontal scrolling and with controls meeting the minimum touch-target size at widths of 360px and above, in both Arabic (RTL) and English (LTR), on mobile, tablet, and desktop breakpoints.
- **SC-007**: With the reduced-motion setting enabled, no non-essential animation plays anywhere in the flow.
- **SC-008**: Every failed submission produces a visible error state with all answers preserved and a working retry; no fabricated success is ever displayed.

## Assumptions

- The six steps listed above describe the intended product flow exactly: the learning domain is a single free-text input (Step 1), learning preferences are collected as a dedicated Step 5, and the single, final Review/Confirmation on Step 6 carries the real submission. A confirmation screen is shown exactly once — on step 6, after Learning Preferences. This arrangement supersedes the seven-step arrangement from Session 2026-09-14 (which duplicated the confirmation around the preferences step).
- The learning domain (Step 1) is free text and is not restricted to the Reqs §2 category list; those categories are reference examples. The AI interprets the entered domain for personalization.
- The learning preferences (Step 5) reuse the product-defined set (hands-on learning, video, reading, quizzes) already used by the current onboarding; their exact stored values belong to the API contract.
- The level options (Beginner / Some experience / Intermediate) and the time options (15-30, 30-60, 1-2 hours a day, weekends only, custom) reuse what the product already defines in the current onboarding; their exact stored values and mapping are API-contract concerns.
- The success goal (step 4) is free text, matching the current implementation and the learning-profile contract's desired-outcome field.
- This spec defines UI/UX behavior only. Backend endpoints, payload fields, value mapping, and the API contract are explicitly out of scope; the submission step will be wired to the real integration and must truthfully reflect its outcome.
- Onboarding answers persist in the client session while navigating within the flow; the behavior on a full reload (whether to resume in-progress onboarding or restart) is a separate integration/product decision and is not addressed here.
- The flow reuses the existing design system and accessibility baseline; no new dependencies or global design changes are introduced.
- After successful submission, the user sees a brief success confirmation and then transitions directly into the roadmap creation/generation experience (see Clarifications J3). That generation flow is a separate product flow managed by its own lifecycle and is outside this spec's scope.