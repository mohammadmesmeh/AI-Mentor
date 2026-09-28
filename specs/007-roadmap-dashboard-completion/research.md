# Research: Roadmap-Driven Dashboard Completion

**Feature**: `specs/007-roadmap-dashboard-completion/spec.md` | **Date**: 2026-09-24

Each entry below gives the **Decision**, its **Rationale** and the **Alternatives considered**.

---

## R-1: Retrieving the learner's latest generation request (Story 1): ⚠️ PENDING CONTRACT

**Status: the design is fixed, but the wire details are pending.** Story 1's implementation tasks are gated on this.

**What is known:**
- The spec's clarification says the backend now serves the learner's latest generation request through the existing `v1/roadmap-generation-requests` resource. No new backend capability is to be requested.
- Evidence checked on 2026-09-24:
  - This repo's `API_CONTRACT.md` §4 and §14–15 document only `POST /roadmap-generation-requests` and `GET /roadmap-generation-requests/{id}`.
  - The local backend snapshot (`../ai-mentor-main/Backend/routes/api.php`) defines only those two routes.
  - No local backend was running on `:8000`, so the route could not be probed.
- The deployed backend is therefore newer than the documentation in this repo.

**Decision:**
- Add **one read-only RTK Query endpoint**, `getLatestGenerationRequest`, that returns `RoadmapGenerationRequest | null`.
- It follows the established `queryFn` pattern used by `getPreferences` and `getLearningProfile` (`src/lib/api/apiSlice.ts`): the documented "learner has no request" response maps to `null` (a valid empty state), and every other failure stays an `ApiError`.
- It provides a new `GenerationRequest` cache tag, which the generate mutation invalidates.

**The three facts to take from the contract before implementing (task gate G-1):**

1. **Path and query.**
   - Candidates: `GET /roadmap-generation-requests` returning a list sorted newest first (then take the first item), or a dedicated "latest" path or filter.
   - Use exactly what the contract documents. Do not probe or guess in production code.
2. **The "no request yet" signal.** One of: an empty list, `404` with a specific error code, or `data: null`. The `queryFn` maps exactly that signal to `null`.
3. **The shape of the returned item.**
   - The plan **assumes** each item has the same representation as the documented §15 generation-request resource (`id`, `status`, `roadmap_id`, `failure_code`, timestamps).
   - That's why the existing `RoadmapGenerationRequest` type and the polling hook are reused unchanged.
   - If the shape differs, adapt the type at the API layer only. The dashboard's state machine (R-2) consumes the domain type and does not change.

**Rationale:**
- It keeps the server as the only source of truth (constitution III; spec FR-003).
- It reuses the existing 2-attempt read retry, error normalization, snake-to-camel mapping and the "not-found means empty state" convention, rather than inventing a new pattern.

**Alternatives considered:**
- *Remembering the IDs in `localStorage`*: rejected by the clarification and by FR-003.
- *Asking for a new `GET /me/roadmap`*: rejected by the clarification, since the capability already exists.
- *Guessing the path and shape now and fixing it later*: rejected, because the user explicitly said not to assume the API contract.

---

## R-2: Dashboard state resolution (one state machine instead of three independent sources)

**Decision:** introduce a `useDashboardRoadmap` hook in `src/features/dashboard/hooks/` as the **single place** that resolves which screen the dashboard shows. It combines:

- the onboarding status (unchanged);
- the latest generation request (R-1);
- the in-session generation request from `useGenerateRoadmap`, which takes precedence once the learner clicks Generate;
- the polling state from `useRoadmapGenerationPolling`;
- the roadmap query.

It returns one discriminated union:

| `view` | When |
|---|---|
| `loading` | Initial queries are still in flight |
| `onboarding-incomplete` | Onboarding status says incomplete |
| `start` | No request exists, or the latest request was **cancelled** |
| `generating` | The request is queued, running or validating (reuses the polling hook) |
| `timed-out` | Polling timed out (existing behavior) |
| `failed` | The request failed; carries `failureCode` |
| `start-error` | Generating could not be started |
| `roadmap-not-ready` | The roadmap has status `draft`, `generating` or `validating`, or `currentVersion` is null |
| `roadmap-inactive` | The roadmap has status `reset`, `archived` or `failed`: it is not the learner's active plan, so the start screen is offered |
| `ready` | The roadmap has status `ready`, `active` or `completed` and a current version; carries the `roadmap` |
| `load-error` | The latest request or the roadmap could not be loaded; carries a retry |

**Rationale:**
- `dashboard-page.tsx` currently mixes these branches inline and only knows about in-session requests.
- A pure resolver function is unit-testable across all spec edge cases.
- The page keeps a flat switch over `view`.
- **FR-002** (never show the start screen for an active roadmap) and **FR-004** (distinguish "none" from "failed to load") become explicit branches instead of accidental fall-throughs.

**Alternatives considered:**
- *Keeping the logic inline in the page*: hard to test, and it is how the reload bug arose.
- *A Redux slice*: rejected, because the dashboard state is a cache of server responses (constitution III / CLAUDE.md) and RTK Query already caches it.

---

## R-3: Deriving the dashboard content from the roadmap

**Decision:** pure, framework-free functions in a new `src/features/dashboard/lib/roadmapProgress.ts`:

| Function | What it does |
|---|---|
| `orderedStages(version)` | Sorts stages, their tasks and each task's resources by `position` (FR-016). Returns new arrays and never mutates cached data. |
| `findCurrentTask(stages)` | Implements the FR-005 order: the first `current` task, otherwise the first `available` task (active stage first, then later stages), otherwise `null`. Returns `{ task, stage }`. |
| `focusTasks(stages, limit = 3)` | Returns the current task, then the other `current`/`available` tasks in roadmap order, up to `limit` (FR-008). |
| `roadmapProgress(stages)` | Returns `{ stageNumber, stageCount, completedTasks, countedTasks, percent, allCompleted, stageStatuses }`. "Counted" means every status except `replaced`, and `percent` is rounded down (FR-009). |

**Rationale:**
- These are display derivations of server-provided statuses. They don't create new state or decide business rules: the server already decides which task is current or available.
- Pure functions make SC-003 ("matches a manual count in 100% of cases") directly testable in Vitest.

**Alternatives considered:**
- *Computing inside each section component*: duplicated logic and untestable.
- *Memoized selectors (reselect)*: unnecessary, since this is cheap per render; a plain `useMemo` in the page is enough.

**Edge-case rulings** (these implement the spec's edge cases):
- **More than one task marked `current`:** the first in roadmap order wins.
- **`skip_pending`, `skipped`, `replaced`, `completed` and `upcoming` tasks:** never selected as the current task or as a focus task.
- **Stage number when no stage is `active`:** the first stage that isn't completed; if all are completed, the last stage.

---

## R-4: "Go to the task" navigation (Continue Learning and Today's Focus)

**Decision:**
- Each task row in `RoadmapView` gets a stable `id="task-<taskId>"`, `tabIndex={-1}` and `scroll-mt` offset for the sticky header.
- The primary action is a plain in-page link, `href="#task-<taskId>"`.
- A `:target` style gives the visual highlight.
- A small click handler moves focus to the row so keyboard and screen-reader users land on it (FR-020).
- The existing global `prefers-reduced-motion` rule already governs the smooth scroll.

**Rationale:**
- This needs no router change, no new page and no dependency, and it works without JavaScript.
- Spec 003 already used this in-page anchor pattern (`#roadmap`).

**Alternatives considered:**
- *A task-detail route*: out of scope (spec Assumptions).
- *`scrollIntoView` only*: loses the URL fragment and browser-back behavior.

---

## R-5: Rendering untrusted roadmap content and resource links

**Decision:**
- All roadmap text renders through React text nodes only, with no `dangerouslySetInnerHTML`. This is already true, and it stays enforced.
- Resource URLs pass through `safeExternalUrl(url)`, which parses with `new URL()` and accepts only the `http:` and `https:` protocols.
- A safe resource renders as `<a target="_blank" rel="noopener noreferrer">`, with a localized "opens in a new tab" hint for assistive technology.
- An unsafe or unparsable URL renders the title as plain text with a localized "link unavailable" note (FR-017).
- Resource rows are keyed by `resource.id`, not by URL.

**Rationale:** roadmap content is AI-generated, so it is untrusted (constitution IV). The main risk vectors are `javascript:` and `data:` URLs.

**Alternatives considered:**
- *Allow-listing domains*: too restrictive for AI-found resources.
- *Rendering no links*: fails the spec's resource-access story.

---

## R-6: Complete and Skip controls while the backend capability is missing

**Decision:**
- Keep both controls rendered, `disabled`, with visible localized helper text "Available soon" linked through `aria-describedby`.
- No mutation endpoint, no handler and no local status change is added (FR-014, Clarification Q2).
- The controls stay on current and available tasks only.

**Rationale:**
- Hiding them would lose the signal that the feature is coming.
- Disabled controls with no explanation, which is today's behavior, fail the spec's "clearly unavailable" requirement.

**Alternatives considered:**
- *Hiding the controls*: acceptable under FR-014, but gives a weaker product signal.
- *Optimistic local toggling*: explicitly forbidden.

---

## R-7: Page composition and heading hierarchy

**Decision:**
- **Order:** Welcome (the only `h1`), then Continue Learning, then a grid of Today's Focus, Mentor Insight, Progress and Recent Activity, then the full roadmap (`id="roadmap"`), which is the last section (FR-015).
- **`RoadmapView`:** its header becomes an `h2`, removing the second `h1` present today.
- **`ProgressSection`:** stops listing stage titles, which fixes the duplication. It shows:
  - the stage summary ("Stage 2 of 3");
  - a tasks-completed count with a progress bar;
  - a segmented stage indicator, one segment per stage coloured by status, with stage titles exposed via `aria-label` and a visually hidden list rather than as a second visible list.
- The `#roadmap` anchor moves from `ProgressSection` to the roadmap section.

**Rationale:** it meets the spec's single-listing rule and spec 003's "one `h1`, an `h2` per section" accessibility rule, and keeps the primary action first.

**Alternatives considered:**
- *Removing the full roadmap from the dashboard*: the learner would lose access to resources.
- *Showing only the stage list in Progress, with no full roadmap*: loses the tasks.

---

## R-8: Localization

**Decision:**
- All new copy goes into the `dashboard` namespace of `messages/en.json` and `messages/ar.json`, with identical key sets.
- Durations use ICU plural messages, for example `taskMinutes: "{count, plural, one {# min} other {# min}}"`, with the correct Arabic plural forms. This replaces the hard-coded ` min` in `RoadmapView`.
- The hard-coded `"Loading…"` in `dashboard-page.tsx` is replaced with a key.
- The percentage is formatted with `Intl.NumberFormat(locale, { style: "percent" })`.

**Rationale:** FR-018 and FR-019, and constitution VIII. next-intl already supports ICU plurals.

**Alternatives considered:** string concatenation, which breaks Arabic plural rules.

---

## R-9: Testing approach

**Decision:**

| Test | Where | What |
|---|---|---|
| Unit | `tests/unit/dashboard/roadmapProgress.test.ts` | Every R-3 function against fixtures covering the spec edge cases. This is the SC-003 evidence. |
| Unit | `tests/unit/dashboard/dashboardView.test.ts` | The pure resolver behind `useDashboardRoadmap` (R-2): each state-to-`view` mapping. |
| Unit | `tests/unit/dashboard/safeExternalUrl.test.ts` | `javascript:`, `data:`, relative, malformed, `http`, `https`. |
| Component | `tests/component/roadmap/*` (extends `view.test.tsx`) | Continue Learning, Today's Focus and Progress render the derived data; disabled controls carry the helper text; unsafe links are not anchors. Uses the existing intl helper in both locales. |
| MSW | `tests/msw/handlers.ts` | Adds a handler for the latest-request retrieval **only after G-1**, using the documented shape. |
| Manual | `quickstart.md` | Reload and re-sign-in, widths, RTL, keyboard. |

**Rationale:** it uses the existing Vitest, MSW and jsdom setup with no new dependencies.
