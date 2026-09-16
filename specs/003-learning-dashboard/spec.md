# Feature Specification: Learning Dashboard

**Feature Branch**: `003-learning-dashboard`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Create the Dashboard specification for the AI Mentor project. The Dashboard is the primary authenticated learning workspace. Its main UX goal is simple: the learner should immediately understand (1) What should I do next? (2) Why should I do it? (3) How am I progressing? Use the existing project context and the provided dashboard references as product inspiration, but do not copy them literally. It must be a realistic production SaaS learning experience — not a design showcase or analytics-heavy admin dashboard."

## Product Purpose

The Dashboard is the primary authenticated learning workspace of AI Mentor. It is the first screen a learner reaches after signing in (when onboarding is complete) and the place the learner returns to between learning sessions.

Its **UX responsibility** is to answer three questions within a few seconds of landing, without requiring the learner to read every section:

1. **What should I do next?** — a single, visually dominant "Continue Learning" action pointing at the current lesson.
2. **Why should I do it?** — a concise AI Mentor Insight (adaptive observation + one recommended next step) and the learner's goal/stage context.
3. **How am I progressing?** — task-based progress/velocity that supports the next-step decision, never distracts from it.

The Dashboard is intentionally **learning-first, not analytics-first**. It prioritizes actionability over statistics, keeps the interface calm and professional, and avoids clutter, excessive cards, gamification, and gimmicky AI visuals.

## Section Definitions — Purpose and UX Responsibility

| # | Section | Purpose | UX Responsibility |
| --- | --- | --- | --- |
| 1 | **Application shell** (sidebar, header, main content) | Persistent authenticated navigation around the learner's workspace. | Establishes context ("where am I in the product") and lightens the page so every screen shows learning content, not chrome. Must never bury the primary action. |
| 2 | **Welcome / learning context** | Orients the learner: who they are in this workspace, their goal, and current stage/milestone. | A short, calm greeting that reinforces WHY they are learning (goal) and ties the page together; must not outshine the Continue Learning action. |
| 3 | **Continue Learning** (primary section + action) | Resume the learner's single most important next step — the current lesson. | Answers "What should I do next?" The strongest visual and interaction element on the page; the only section a returning learner should need to act on. |
| 4 | **Today's Focus** | A small, prioritized set of learning tasks for the current session. | Converts the roadmap into an actionable, bounded next move (a few tasks, not a plan wall). Must be short, scannable, and completion-oriented so the learner can act and feel progress. |
| 5 | **AI Mentor Insight** | A concise adaptive observation and a single recommended next step. | Answers "Why should I do it?" by connecting learner state to a justified, actionable suggestion. Must never feel like a marketing banner; when no valid recommendation exists it must degrade gracefully rather than fabricate one. |
| 6 | **Progress / learning velocity** | Lean, learner-facing progress information derived from tasks. | Answers "How am I progressing?" with a simple indicator (e.g., completed portion and current stage) that supports the next-step decision instead of distracting from it. |
| 7 | **Recent Activity** | A short list of the learner's most recent learning events (completed/skipped tasks, stage changes). | Secondary section that supports momentum and recall. Must be compact, safe to ignore, and must degrade gracefully (no fabricated events) when unavailable. |

## Core Experience Principles

- The next action is obvious within a few seconds; reading every section is never required to know what to do next.
- The primary CTA is a single, visually clear element.
- Actionability > statistics.
- Calm, premium, spacious, professional.
- Minimal purposeful motion only; no decorative effects competing with learning actions.
- Reuses the existing design system and architectural conventions.
- Server Components preferred; minimal client-side JavaScript.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resume current lesson from the primary action (Priority: P1)

A returning learner with a persisted roadmap lands on the dashboard, instantly recognizes **Continue Learning** with their current lesson, and resumes it with a single click/tap.

**Why this priority**: This is the core purpose of the Dashboard. If the learner cannot tell what to do next and act in seconds, the page has failed regardless of the rest of the content.

**Independent Test**: Load `/en/dashboard` with a roadmap present, confirm the current lesson is the primary CTA, navigate to the lesson, and return; the dashboard continues to show the same current lesson with intact state. Delivers the primary value of the workspace.

**Acceptance Scenarios**:

1. **Given** an authenticated learner with a persisted roadmap and a validated current lesson, **When** the dashboard loads, **Then** "Continue Learning" is the single most visually prominent action and its label includes the current lesson in the active locale.
2. **Given** the Continue Learning action, **When** the learner activates it, **Then** the learner is taken to the current lesson with at most two clicks/taps from landing.
3. **Given** a lesson resume in progress, **When** the dashboard is still visible, **Then** the action reflects a clear, localized loading state and cannot be double-activated.
4. **Given** a dashboard where the roadmap has no current lesson defined, **When** the section cannot determine a current lesson, **Then** the section reframes to the "no current lesson" state (US3) instead of showing a broken or empty action.

---

### User Story 2 - Learner without an active learning path (Priority: P1)

A new learner who signed up but has not generated a roadmap sees an **Empty Dashboard** state that clearly explains onboarding is the next step and offers the single action to create their roadmap.

**Why this priority**: This is the entry point of the entire product funnel; without a working "no roadmap" state, new learners are stranded after sign-in.

**Independent Test**: Load `/en/dashboard` with no roadmap, confirm the empty state text and the "Create My Roadmap" action, complete onboarding, and confirm the empty state disappears. Delivers the sign-in → onboard → learn funnel.

**Acceptance Scenarios**:

1. **Given** an authenticated learner with no active roadmap, **When** the dashboard loads, **Then** the dashboard shows the empty state with localized explanation and a single primary action to start/return to onboarding; no partial or broken sections are rendered.
2. **Given** the empty state, **When** the learner activates the create-roadmap action, **Then** they are routed to the existing onboarding flow in the same locale.
3. **Given** a learner mid-onboarding (roadmap not yet generated), **When** they visit the dashboard, **Then** the empty state remains truthful (no invented roadmap or progress).

---

### User Story 3 - Learner reviews Today's Focus and completes a task (Priority: P2)

A learner with an active roadmap uses **Today's Focus** to see a small, prioritized set of current tasks, completes one, and sees the focus list update to reflect completion (checked state) without leaving the dashboard or reloading the page.

**Why this priority**: Focus turns an abstract roadmap into an actionable bounded session, and task completion is the defined progress primitives of the product (equal-weight, declaration-based).

**Independent Test**: With an active roadmap containing tasks, confirm Today's Focus lists at most 3 prioritized tasks, complete a task from the list, and confirm the completed task is reflected (checked) and the focus set re-prioritizes. Delivers an actionable, completion-oriented working session.

**Acceptance Scenarios**:

1. **Given** an active roadmap with defined tasks, **When** the focus section renders, **Then** it shows a small prioritized set (max 3) of the learner's current session tasks with their titles in the roadmap language; the section header is scannable and the tasks are ordered by priority.
2. **Given** a learner completes one focus task, **When** the completion is registered (existing task-completion semantics), **Then** the focus list reflects the completed task (checked state) and re-prioritizes remaining tasks without a full page reload.
3. **Given** no focus tasks are defined for the current session, **When** the section cannot determine tasks, **Then** it shows the "no focus tasks" state with a constructive localized message (e.g., pointing to the current lesson) rather than an empty wall.

---

### User Story 4 - Learner acts on the AI Mentor Insight (Priority: P2)

A learner with a valid recommendation sees a concise **AI Mentor Insight** (observation + one recommended next step), understands why it is suggested, and can act on it by either navigating to the recommended next step or acknowledging/using the insight. When no valid recommendation exists, the section degrades gracefully (hidden or a neutral placeholder) and NEVER shows fabricated recommendations.

**Why this priority**: Adaptive guidance is the product's differentiator and the "why" behind the next action; but it must remain honest — a missing recommendation must never be faked.

**Independent Test**: With data that can support a recommendation, confirm the insight shows the observation and recommended next step in the active locale; with no recommendation available, confirm the section degrades with no fabricated content. Delivers adaptive guidance without inventing AI behavior.

**Acceptance Scenarios**:

1. **Given** a valid, validated recommendation is available, **When** the dashboard loads, **Then** the section shows one concise observation and one recommended next step, localized and visually secondary to the primary CTA.
2. **Given** a recommendation that references a concrete next step, **When** the learner activates the action, **Then** they are routed to that step using existing navigation in the same locale.
3. **Given** no recommendation is available (e.g., provider unavailable, no recommendation content), **When** the dashboard renders, **Then** the section degrades gracefully — hidden or showing a neutral localized placeholder — and never synthesizes a fake recommendation.
4. **Given** a learner completed the recommended step, **When** the dashboard reloads, **Then** the insight reflects the new state (or degrades) instead of repeating a stale recommendation verbatim.

---

### User Story 5 - Learner reads their progress/learning velocity (Priority: P2)

A learner uses the **Progress / learning velocity** section to see a truthful, task-based summary of where they are in the roadmap (completed portion, current stage) that supports their next-step decision without overwhelming them with statistics.

**Why this priority**: Progress is one of the three core questions, but it must remain learner-facing and low-noise; heavy analytics belong outside the Dashboard (out of scope).

**Independent Test**: With a roadmap and completed tasks, confirm the progress section shows task-based progress and the current stage, and that the numbers reflect the existing progress calculation (effective tasks) — not arbitrary diagnostic percentages. Delivers truthful progress without analytics noise.

**Acceptance Scenarios**:

1. **Given** a roadmap with tasks in multiple states, **When** the progress section renders, **Then** it shows a small set of learner-facing indicators (e.g., completed portion and current stage) derived from the defined task-completion semantics.
2. **Given** a task states change (completion, skip, replacement, removal), **When** progress is displayed, **Then** the displayed portion reflects the existing progress calculation based on effective tasks (replaced/removed tasks do not count as active required tasks).
3. **Given** the progress calculation or its underlying data is not yet available, **When** the section would render, **Then** it shows the loading/empty state and never invents arbitrary diagnostic percentages or fabricated streak/telemetry metrics.

---

### User Story 6 - Recent Activity secondary section (Priority: P3)

A learner sees a compact list of their most recent learning events. When recent-activity data is unavailable, the section degrades gracefully — hidden or showing an explicit localized "unavailable" state — and NEVER fabricates events.

**Why this priority**: Secondary support for momentum; it must be safe to ignore and must never mislead.

**Independent Test**: With recent-activity data, confirm recent events (completed/skipped tasks, stage changes) render in reverse-chronological order; without data, confirm the section hides or shows an explicit neutral state. Delivers momentum without fabrication.

**Acceptance Scenarios**:

1. **Given** available recent-activity data, **When** the dashboard renders, **Then** the section shows a short, compact list of the most recent learning events, each with a localized label and timestamp, in reverse-chronological order.
2. **Given** recent-activity data is unavailable, **When** the dashboard renders, **Then** the section degrades (hidden or an explicit "unavailable" state) rather than showing placeholder or fake events.
3. **Given** the recent activity is an offline or partial dataset, **When** rendered, **Then** no event is presented as authoritative if it did not pass the defined validation path — per the AI/user-generated-content trust rules.

---

### User Story 7 - Dashboard on tablet and mobile (Priority: P2)

A learner on tablet or mobile gets an **intentional** adaptation — not a compressed desktop layout — with the navigation moving into the header (drawer/compact rail), the content reordered so the primary action stays discoverable, and no horizontal overflow.

**Why this priority**: Mobile and tablet are explicit product requirements; a broken or cramped dashboard is a regression of the core workspace.

**Independent Test**: Render the dashboard at 375px, 768px, and 1024px in both locales; confirm the primary CTA is reachable without long scrolls, navigation adapts (header/sidebar behavior), and no horizontal overflow occurs with all controls usable. Delivers an adaptive, usable workspace on supported devices.

**Acceptance Scenarios**:

1. **Given** a tablet viewport, **When** the sidebar/header adapt, **Then** navigation remains available (compact rail or header) and the main content uses the full available width with intact section order.
2. **Given** a mobile viewport, **When** the dashboard renders, **Then** the layout is single-column, the Continue Learning action is discoverable without requiring a deep scroll, and all touch targets meet the design-system minimum.
3. **Given** extreme narrow widths (320px), **When** the dashboard renders, **Then** no horizontal overflow occurs and all interactive elements remain reachable, in both LTR and RTL.

---

### Edge Cases

- **No active roadmap**: Dashboard shows the Empty state (US2) — never a partial dashboard or invented roadmap.
- **Active roadmap, no current lesson/task**: Continue Learning and Today's Focus reframe to their no-current-lesson / no-focus-tasks states (US1 acceptance 4, US3 acceptance 3) instead of showing dead actions.
- **No AI recommendation**: AI Mentor Insight degrades gracefully (hidden or neutral placeholder) — never a fake recommendation (US4 acceptance 3).
- **Recent activity unavailable**: Section hides or shows an explicit unavailable state — no fake or placeholder events (US6 acceptance 2).
- **Data loading failure**: A localized, retryable loading/error state is shown per affected section; no section renders fabricated or cached-but-stale data as if fresh; the learner can retry without losing their position.
- **First visit / mid-onboarding**: Loading → Empty state sequence is truthful and never presents fabricated progress.
- **Concurrent completion (two devices)**: Completing the same task from two devices does not produce duplicate visual state or corrupted progress display — the presented state is based on the persisted/authoritative state (exact semantics verified during technical planning).
- **Locale switch while viewing**: All sections re-render in the new locale/direction with no stale text and no LTR/RTL layout breakage.
- **Reduced motion enabled**: Streaming/reveal/decorative motion is suppressed by the existing reduced-motion rules; static fallback content remains readable and correct.
- **Lesson resume already in progress**: Double activation prevented; localized pending state shown (US1 acceptance 3).
- **Task already completed**: A task that is already complete is not re-presented as actionable (deduplication of completed focus tasks).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST preserve the current `/dashboard` route (per locale) and its server page, and preserve the existing post-auth redirect rule (dashboard when onboarding is complete, otherwise onboarding) and the existing already-authenticated redirect behavior.
- **FR-002**: The Dashboard MUST answer the three core questions within a few seconds: the primary action (What), the rationale (Why), and the progress (How) must be visible without reading every section.
- **FR-003**: System MUST render "Continue Learning" as the single most visually prominent section and primary CTA, labeled with the current lesson in the active locale; activating it MUST navigate to the current lesson with at most two clicks/taps from landing.
- **FR-004**: System MUST render "Today's Focus" as a small, prioritized set (maximum 3) of the learner's current session tasks; completing a focus task MUST reflect completion (checked state) without a full page reload.
- **FR-005**: System MUST render "AI Mentor Insight" as one concise observation and one recommended next step, derived from validated learner state; when no valid recommendation exists it MUST degrade gracefully and MUST NOT fabricate a recommendation.
- **FR-006**: System MUST render "Progress / learning velocity" with only learner-facing task-based indicators (e.g., completed portion, current stage) consistent with the defined task-completion semantics; it MUST NOT display arbitrary diagnostic percentages, fabricated streak mechanics, or telemetry status.
- **FR-007**: System MUST render "Recent Activity" as a compact secondary list of the learner's most recent learning events in reverse-chronological order; when unavailable it MUST degrade gracefully and MUST NOT fabricate events.
- **FR-008**: System MUST render the Welcome / learning context with the learner's goal and current stage/milestone context, secondary to the primary action.
- **FR-009**: The Dashboard MUST cover the required states — loading, empty dashboard, no active learning path, no current lesson, no focus tasks, no AI recommendation, recent activity unavailable, and data loading failure — with understandable, localized UI per state.
- **FR-010**: The Dashboard MUST NOT invent backend behavior: no API endpoints, contracts, database fields, service methods, AI behavior, or authentication behavior may be invented. Any backend data required but not verifiable from the current product must be marked "verify during technical planning" (see Backend Information section).
- **FR-011**: All data displayed MUST come from the existing persisted/validated state (or the defined verify-during-planning boundaries); AI-generated or user-generated content MUST be treated as untrusted and rendered as plain text (no raw HTML).
- **FR-012**: The Dashboard MUST NOT include the optional/out-of-scope concepts listed in Out of Scope (telemetry sync status, mode switches, recalibration/diagnostic modals, audit/session history, fake notification counts, fake streaks, arbitrary diagnostic percentages).

### UI & Design Requirements

- **DR-001**: The Dashboard MUST reuse the existing design system (Tailwind tokens, `Container`, `Button`, `Card`, existing nav patterns) and MUST NOT introduce global palette changes, new s, or new dependencies.
- **DR-002**: Visual direction is white and very light blue surfaces, navy as the primary dark accent, subtle borders and shadows, soft blue accents, limited gradients, limited glassmorphism, no neon effects, no excessive glowing, and no decorative effects that compete with learning actions — mapped onto existing theme-aware tokens (e.g., primary/midnight navy family, `light-blue-bg`/`light-blue-text`, `bg-card`, `border-*`).
- **DR-003**: **Theme conflict (documented decision, mirroring the auth-page precedent)**: the app default theme is dark while this direction is a light canvas. Existing architecture takes priority: the Dashboard MUST be built from theme-aware tokens so it remains fully readable and functional in the default dark theme AND the light theme. The design direction MUST NOT force a global theme and MUST NOT change the ThemeProvider default.
- **DR-004**: Layout MUST be calm, premium, spacious, and low-card-count; the page MUST NOT assemble into an analytics dashboard or "dashboard clutter" of many small cards.
- **DR-005**: The Continue Learning section MUST be the visually strongest element (containing the primary CTA); today's focus and progress are visually secondary; AI insight is accent-soft; recent activity is visually quiet.
- **DR-006**: Motion MUST be minimal and purposeful (e.g., subtle reveal/state transitions) and every animation MUST respect the existing `motion-reduce` rules; no gimmicky AI visuals, no streaks, no extravagant animation.
- **DR-007**: The Welcome / learning context and AI insight copy MUST follow the existing heading/typography hierarchy (Nunito stack, existing text utilities) and muted-foreground conventions for secondary text.

### Responsive Layout Requirements

- **RR-001**: Desktop (approx. ≥1024px) uses the authentic app shell: persistent sidebar navigation + header + main content in a spacious grid.
- **RR-002**: Tablet (approx. 768–1023px): the sidebar collapses to a compact rail or header navigation and the main content uses the full remaining width; section order is preserved.
- **RR-003**: Mobile (<768px): single-column main content; navigation moves into the header (drawer/menu); the Continue Learning action remains discoverable without a deep scroll; this is an intentional adaptation, not a compressed desktop layout.
- **RR-004**: The Dashboard MUST NOT allow horizontal overflow at 320px, 375px, 768px, 1024px, and 1440px in both `en` (LTR) and `ar` (RTL), with all interactive elements fully reachable.
- **RR-005**: All interactive elements MUST meet the design-system minimum touch-target size and remain usable between breakpoints (no clipped or overlapping elements when the shell collapses).

### Internationalization Requirements

- **IR-001**: All user-facing strings introduced by the Dashboard MUST be added to `messages/en.json` and `messages/ar.json` — no hardcoded strings in components.
- **IR-002**: RTL MUST be treated as first-class for every section, with logical layout properties (start/end ordering, mirrored sidebar, directional icon handling) and correct text direction; no hardcoded physical left/right positioning.
- **IR-003**: Content language and interface language remain independent (e.g., an Arabic UI may show English lesson/task titles sourced from the learner's roadmap) — locale formatting and rendering must not break this.
- **IR-004**: Locale-aware formatting is used for any dates/times shown (recent activity, lesson timestamps).

### Accessibility Requirements

- **AR-001**: The page MUST expose a single logical `main` landmark for dashboard content and semantic heading hierarchy (one `h1`, `h2` per section, `h3` within sections where needed).
- **AR-002**: The full dashboard path MUST be operable by keyboard alone: logical tab order, visible focus on all controls, drawer/menu toggles with appropriate `aria-expanded`/`aria-label`, no bare `div` click targets.
- **AR-003**: Icon-only controls (menu toggle, any section actions) MUST have descriptive localized accessible labels.
- **AR-004**: The primary CTA and all links/buttons MUST use correct button/link semantics and be distinguishable as interactive (visible focus, sufficient contrast, non-color-only indicators).
- **AR-005**: Text/content MUST maintain sufficient contrast against white/light-blue surfaces in both themes (existing token contrast rules preserved).
- **AR-006**: All animation and transitions MUST respect the existing `motion-reduce` media query; reduced-motion users get static, readable fallback content.
- **AR-007**: Loading/empty/error state changes MUST be perceivable to assistive technology (e.g., `aria-busy`/live region where the system announces a substantive state change), without being noisy.

### Security Requirements

- **SR-001**: No secrets, tokens, or credentials are introduced; no unsafe URL handling (all navigation via the existing localized navigation helpers); no raw HTML rendering of untrusted content (lesson, task, insight, activity text treated as plain text).
- **SR-002**: The Dashboard MUST NOT expose one learner's data to another (roadmaps, tasks, progress, chat, activity all remain ownership-bound); UI behavior MUST NOT become a security boundary — data access/authorization remain server-side responsibilities.
- **SR-003**: The Dashboard MUST NOT fabricate data to fill states: no fake AI recommendations, no fake recent activity, no fake streaks/notification counts, no arbitrary diagnostic percentages.
- **SR-004**: Minimal learner data is sufficient for the Dashboard; the Dashboard MUST NOT add unnecessary outbound requests or send unnecessary learner data to external services.

### Performance Requirements

- **PR-001**: The Dashboard MUST prefer Server Components and minimize client-side JavaScript; client-side state and re-renders MUST be kept to the minimum required for the interactive primitives (task completion reflection, navigation drawer).
- **PR-002**: The Dashboard MUST avoid duplicate requests and unnecessary re-fetching; a section that has no data source MUST degrade gracefully rather than retry pointlessly.
- **PR-003**: No new dependencies are introduced; existing project capabilities (design system, i18n, routing, animation utilities) are reused.

### Backend Information — Verify During Technical Planning

The current product derives Dashboard content from existing frontend state (auth + onboarding + roadmap) and does not connect a real backend. Backend requirements are NOT invented by this specification. The following are **explicitly marked for verification during technical planning** and must NOT be assumed by implementation:

- **VR-001**: Data source (API/service) and contract for the persisted roadmap, stages, tasks, and their states (including effective/required task calculation) — current frontend roadmap is a mock (milestone title list).
- **VR-002**: Data source and contract for the "current lesson" (the object the Continue Learning primary action must target).
- **VR-003**: Data source and contract for "Today's Focus" task prioritization and the completion mutation (existing task-completion semantics; concurrency/idempotency rules per the Requirements).
- **VR-004**: Data source and contract for the AI Mentor Insight (observation + recommended next step), including validation and the "no recommendation" signal; where AI is involved, its output must pass the defined validation pipeline before display.
- **VR-005**: Data source and contract for progress/learning-velocity calculation (task-based; replaced/removed tasks do not count as active required tasks).
- **VR-006**: Data source and contract for Recent Activity events.
- **VR-007**: Whether any learner timezone/locale/date formatting inputs affect displayed data (e.g., activity timestamps).
- **VR-008**: Required loading/empty/error signals per section (how the frontend distinguishes loading vs empty vs unavailable vs failure in each boundary).

### Out of Scope

- **OS-001**: All backend implementation, new endpoints, new database fields, new jobs, or authentication changes (no API contracts are authored by this spec — VR-001..VR-008 are verify-during-planning markers).
- **OS-002**: Entire Mentor chat feature (a single Mentor chat stream is its own feature); this spec covers only the concise AI Mentor Insight surface on the Dashboard.
- **OS-003**: Telemetry synchronization status, "Active Learner / New Learner" mode switch, "Recalibrate Goals", diagnostic calibration modal, audit/session history, fake notification counts, fake streak mechanics, and arbitrary diagnostic percentages (explicitly optional/out of scope per the task unless existing requirements confirm them — they do not).
- **OS-004**: Separate profile/settings pages, notification center, roadmap management screens, or roadmap editing UI beyond the Continue Learning entry point to the current lesson.
- **OS-005**: New dependencies, global design-token/theme changes beyond reading existing tokens, font changes, or provider SDKs.

### Key Entities

Product-level entities the Dashboard consumes (existing product concepts from the Requirements — no new data models are authored here; the backend shapes of all of these are to be verified in technical planning per VR-001..VR-008):

- **Learner**: The authenticated user; Dashboard shows only the learner's own data.
- **Roadmap**: The learner's persisted, AI-generated plan (goal; one active roadmap per MVP); it is the source of truth, never regenerated per request.
- **Stage**: A division of the roadmap; considered complete when all its required and effective tasks are complete.
- **Task**: A learning unit (Read / Watch / Quiz / Project / Assignment / Coding Challenge) with a state (pending/complete/skipped/replaced/removed) and required/effective classification; completion is learner-declared and task-based progress is derived from effective tasks.
- **Current Lesson**: The task the learner should do next; the target of the Continue Learning primary action.
- **Focus Tasks**: The small, prioritized subset of current-session tasks shown in Today's Focus.
- **AI Mentor Insight**: A validated observation + one recommended next step for the learner.
- **Learning Progress**: Task-derived learner-facing indicators of where the learner is in the roadmap.
- **Recent Activity**: The learner's recent learning events (e.g., completed/skipped tasks, stage changes).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can identify their single recommended next action ("Continue Learning" + current lesson) within a few seconds of landing **without reading every section** (verified via visual/task check on desktop and mobile).
- **SC-002**: A learner can resume the current lesson with at most two clicks/taps from landing in both `en` and `ar`.
- **SC-003**: 100% of dashboard copy is present in both `messages/en.json` and `messages/ar.json`; zero hardcoded user-facing strings.
- **SC-004**: The dashboard renders with no horizontal overflow and all controls usable at 375px, 768px, 1024px, and 1440px in both LTR and RTL, with navigation adapting intentionally (sidebar → compact → header) rather than compressing.
- **SC-005**: A learner can complete a focus task and observe the checked/updated focus state without a full page reload; completed tasks are not re-presented as actionable.
- **SC-006**: When no AI recommendation exists, the Insight section degrades gracefully and displays no fabricated recommendation — verified in both locales.
- **SC-007**: Progress indicators reflect the existing task-completion semantics (effective tasks; replaced/removed tasks not counted as active required tasks) and include no arbitrary diagnostic percentages or fabricated gamification metrics.
- **SC-008**: Loading, empty, and data-failure states are understandable, localized, and (for failures) retryable, and no section ever renders fabricated or stale-as-fresh data.
- **SC-009**: The full dashboard is keyboard-operable with visible focus and correct landmark/semantics in both locales; motion respects reduced-motion rules.
- **SC-010**: Existing behavior is preserved: post-auth redirect rule (`/dashboard` when onboarding complete, else `/onboarding`), the existing `/dashboard` route, and no regressions in onboarding/auth/home — confirmed by the project's standard build and lint validation passing with no new dependencies.

## Assumptions

- The dashboard is the authenticated landing experience; the existing post-auth redirect rule and route are preserved and reused, not recreated.
- The current product derives roadmap data from the existing frontend mock (onboarding roadmap). Wherever the Dashboard needs data not verifiable today (current lesson, focus, insight, progress, activity), the backend contract is marked for verification during technical planning (VR-001..VR-008) and must not be fabricated.
- The app default theme is dark; the white/very-light-blue direction is the light-theme manifestation, and the Dashboard must remain fully usable in both themes without changing the ThemeProvider default (documented decision, mirroring the auth precedent).
- Mobile and tablet use an intentional adaptive hierarchy (navigation moves to header/compact rail; content reorders so the primary action stays discoverable) — not a compressed desktop layout.
- Mentor chat, streaks/achievements ledgers, telemetry, notifications, and administrative/analytics surfaces are separate features and NOT part of this Dashboard.
- Content language and interface language are independent (lesson/task titles may render in a language different from the UI language).
- The provided dashboard references are product inspiration only; their visual details are not copied literally, and nothing prototype/demo-only is converted into a confirmed product requirement.

## Open Questions ([NEEDS CLARIFICATION], max 3)

| ID | Question | Status / Decision |
| --- | --- | --- |
| Q1 | Which backend data source/contracts supply the Dashboard sections (current lesson, focus, insight, progress, activity)? | **DEFERRED TO PLANNING** — Do not invent. Existing product Requirements and mock state define what the frontend has today; everything else is explicitly marked for verification during technical planning (VR-001..VR-008). No `[NEEDS CLARIFICATION]` marker remains in this spec. |