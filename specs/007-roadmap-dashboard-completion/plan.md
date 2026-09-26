# Implementation Plan: Roadmap-Driven Dashboard Completion

**Branch**: `007-roadmap-dashboard-completion` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-roadmap-dashboard-completion/spec.md`

## Summary

Make the dashboard reflect the learner's real roadmap:

1. **Rediscover the roadmap (Story 1).** On reload or a new sign-in, the dashboard finds the learner's roadmap from their latest generation request, using the existing `roadmap-generation-requests` resource (R-1).
2. **Resolve the screen in one place.** A single state machine, `useDashboardRoadmap`, decides which screen the dashboard shows (R-2).
3. **Derive the sections from the roadmap.** Continue Learning, Today's Focus and Progress are computed from the roadmap's own statuses by pure, tested functions (R-3).
4. **Reshape the page.** One ordered workspace with jump-to-task links (R-4), safe resource links (R-5) and a heading hierarchy with a single `h1` (R-7).

Complete and Skip stay disabled with localized "available soon" text (R-6), because their endpoints don't exist.

**Gate G-1:** Story 1's API wiring is blocked until `API_CONTRACT.md` documents the actual latest-request response. Everything else can be built now.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.2 App Router

**Primary Dependencies**: Redux Toolkit / RTK Query (existing `apiSlice`), next-intl 4 (ICU messages), Tailwind CSS v4, lucide-react. **No new dependencies.**

**Storage**: None on the client. No `localStorage` or `sessionStorage`; the RTK Query cache only (constitution III, spec FR-003).

**Testing**: Vitest + jsdom + MSW (`tests/unit`, `tests/component`) and Playwright (`tests/e2e`, optional). Existing setup.

**Target Platform**: Modern evergreen browsers; mobile, tablet and desktop; RTL (`ar`, default) and LTR (`en`).

**Project Type**: Web application frontend (single Next.js project; the backend is a separate repo).

**Performance Goals**:
- The learner can identify and reach the next task within 5 seconds and in at most one action (SC-002).
- The derivations are O(tasks) per render, with no extra network round trips beyond the latest request plus the roadmap.

**Constraints**:
- Never show the start screen unless the server says there is no request or it was cancelled (FR-002).
- No invented endpoints (G-1, Story 5).
- Roadmap content is untrusted (FR-017).
- No horizontal overflow at 320px (FR-019).

**Scale/Scope**: One route (`/[locale]/dashboard`). The work covers:
- about 6 components touched;
- 2 new hooks or lib modules;
- about 20 i18n keys per locale;
- 1 new API endpoint definition, gated on G-1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Assessment | Result |
|---|---|---|
| I. Security, privacy, data ownership | Tokens are untouched (the existing in-memory session). Foreign or unknown IDs are handled as `not_found` by the existing error mapping. Resource URLs are protocol-allow-listed (R-5). | ✅ Pass |
| II. Separation of responsibilities | The frontend only *reads* server statuses. Choosing the current task and counting progress are display derivations of statuses the backend decides; no business rule such as unlocking or dependency resolution is re-implemented. The backend contract is consumed, not changed. | ✅ Pass |
| III. Authoritative state | No client persistence of roadmap or request IDs. No optimistic or local status changes. The RTK Query cache is the only client copy, and it is invalidated by the generate mutation. | ✅ Pass |
| IV. Responsible AI output | Roadmap text renders as plain text only. Links are validated; unsafe ones are not clickable. | ✅ Pass |
| V. Provider replaceability | No AI-provider coupling in the frontend. The asynchronous generation contract is preserved. | ✅ Pass |
| VI. Reliability and failure handling | Reads use the existing bounded retry. `load-error` is a distinct, recoverable view; a failure never falls through to the start screen. | ✅ Pass |
| VII. Idempotency and concurrency | No new mutations. Generation keeps its per-click idempotency key and the existing 409 `roadmap_generation_in_progress` resume. | ✅ Pass |
| VIII. i18n, responsiveness, inclusive UX | All copy is in both locales with ICU plurals. Layout uses logical properties. One `h1`. Focus moves on jump-to-task. There is a progressbar role. Reduced motion is respected. | ✅ Pass |
| IX. Maintainability and observability | The derivations and view resolver are pure and unit-tested. Errors flow through `ApiError`. | ✅ Pass |
| X. Explicit scope | Complete and Skip are not implemented (Clarification Q2). No endpoint is assumed (G-1). Mentor Insight and Recent Activity are unchanged. | ✅ Pass, with gate G-1 recorded |

**Gate result:** PASS. There are no violations, so Complexity Tracking is empty.

**Open dependency (not a violation):** G-1, the missing contract documentation. Story 1's tasks must be sequenced after it is closed.

**Post-design re-check (after Phase 1):**
- **II:** unchanged; the data-model derivations use only server statuses.
- **III:** the resolver invariant keeps `start` reachable only from a server "none" or `cancelled`.
- **X:** `contracts/api-dependencies.md` forbids writing the latest-request call before G-1.

Result: ✅ still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/007-roadmap-dashboard-completion/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: R-1 … R-9
├── data-model.md        # Phase 1: entities + derived view models
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   ├── api-dependencies.md   # consumed endpoints, gate G-1, deferred task actions
│   └── dashboard-ui.md       # page order, section props, states, i18n keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
src/
├── lib/api/
│   ├── apiSlice.ts                 # + getLatestGenerationRequest (queryFn, null on "none"): after G-1
│   │                               #   + "GenerationRequest" tag; requestRoadmapGeneration invalidates it
│   └── types.ts                    # unchanged unless G-1 reveals a different item shape
├── features/dashboard/
│   ├── lib/
│   │   ├── roadmapProgress.ts      # NEW: orderedStages, findCurrentTask, focusTasks, roadmapProgress
│   │   ├── dashboardView.ts        # NEW: pure resolveDashboardView(...) → DashboardView union
│   │   └── safeExternalUrl.ts      # NEW: http(s)-only URL guard
│   ├── hooks/
│   │   ├── useDashboardRoadmap.ts  # NEW: wires queries and hooks into resolveDashboardView
│   │   ├── useGenerateRoadmap.ts   # unchanged
│   │   └── useRoadmapGenerationPolling.ts  # unchanged
│   └── components/
│       ├── pages/dashboard-page.tsx        # switch over DashboardView; new page order
│       ├── RoadmapView.tsx                 # h2, id="roadmap", task anchors, safe links,
│       │                                   #   ICU minutes, disabled actions with helper text
│       └── sections/
│           ├── ContinueLearningSection.tsx # real current task / completion / nothing-to-start
│           ├── TodayFocusSection.tsx       # up to 3 actionable tasks
│           └── ProgressSection.tsx         # counts + progress bar + stage-status segments
messages/
├── en.json                         # + dashboard.* keys (contracts/dashboard-ui.md)
└── ar.json                         # identical key set

tests/
├── unit/dashboard/
│   ├── roadmapProgress.test.ts     # NEW (SC-003)
│   ├── dashboardView.test.ts       # NEW (FR-002 / FR-004 invariants)
│   └── safeExternalUrl.test.ts     # NEW (SC-007)
├── component/roadmap/view.test.tsx # extended: sections, disabled actions, unsafe links
└── msw/handlers.ts                 # + latest-request handler: after G-1 only
```

**Structure Decision:** this is the existing single-project Next.js layout. All work stays inside `src/features/dashboard/`, plus one endpoint definition in `src/lib/api/apiSlice.ts`, plus the two message files. It follows the feature/shared split in CLAUDE.md. Nothing moves into `src/shared/`, because only the dashboard uses it.

## Implementation Sequencing (input for `/speckit-tasks`)

1. **Foundational** (no G-1 dependency):
   - `roadmapProgress.ts`, `safeExternalUrl.ts` and `dashboardView.ts`, with their unit tests;
   - the i18n keys in both locales.
2. **Stories 2, 3, 4 and 6** (no G-1 dependency), driven by the roadmap loaded in-session after generation:
   - the section rewrites;
   - the `RoadmapView` changes;
   - the new page order.
3. **Story 1:**
   - *Before G-1:* `useDashboardRoadmap` is built with only the in-session source, which is today's behavior.
   - *After G-1:* add `getLatestGenerationRequest`, its MSW handler and tests, and plug it into the hook.
4. **Story 5:** not implemented. Only the FR-014 disabled-state polish in step 2.
5. **Polish:** quickstart A–F, both locales, three widths, a11y, then lint, tsc, test and build.

## Complexity Tracking

No constitution violations, so this section is empty.
