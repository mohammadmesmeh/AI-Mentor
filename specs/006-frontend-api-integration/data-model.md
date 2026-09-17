# Phase 1 Data Model: Frontend API Integration

Client-side representation of each entity from `spec.md`'s Key Entities,
concretized against `API_CONTRACT.md`'s exact wire schema. This is the shape
the new `src/lib/api/` layer and reshaped Redux slices must produce — not a
restatement of the wire format itself (see `API_CONTRACT.md` for that).

Two important departures from the *current* mock state shape are called out
explicitly, since they are the concrete implementation impact of this
feature's data model not matching the existing one.

## User

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (ULID) | |
| `name` | `string` | |
| `email` | `string` | |
| `status` | `"active" \| "suspended" \| "deletion_requested"` | Only `"active"` can complete sign-in (contract §10); other values are theoretical for a signed-in session. |
| `emailVerifiedAt` | `string` (ISO-8601) `\| null` | |
| `lastLoginAt` | `string` (ISO-8601) `\| null` | |
| `createdAt` | `string` (ISO-8601) | |

Held in Redux (`authSlice.user`) — non-secret, safe to inspect in DevTools.

## Session (tokens)

| Field | Type | Notes |
|---|---|---|
| `accessToken` | `string` | ~15 min lifetime (contract §3). |
| `refreshToken` | `string` | ~30 day lifetime, rotated every refresh. |
| `expiresAt` | `number` (client-computed epoch ms) | Derived from `expires_in` at receipt time, used only to decide when to proactively avoid a doomed request — the API's own `401` remains authoritative. |

**Not held in Redux.** Lives in the module-level store in `src/lib/api/auth.ts`
(see `research.md` §3). Redux only holds `isAuthenticated: boolean`, derived
from whether a session currently exists.

**Departure from current code**: `authSlice.ts` today persists a fake session
to `localStorage` under `ai-mentor-auth` and reads it back at module load —
this entire mechanism is removed, not extended (spec FR-007, Assumptions).

## Preferences

| Field | Type | Notes |
|---|---|---|
| `uiLocale` | `"ar" \| "en"` | |
| `resourceLanguage` | `"ar" \| "en" \| "both"` | |
| `timezone` | `string` (IANA, ≤64 chars) | |
| `updatedAt` | `string` (ISO-8601) | |

`PATCH` is partial — only send fields the user actually changed (FR-009). A
`404 user_preferences_not_found` response for a legacy account is not an
error state; it is one specific shape of "onboarding incomplete" (FR-022) and
must be handled by the same missing-onboarding-information path as any other
missing field, not a separate error branch.

## Learning Profile

| Field | Type | Notes |
|---|---|---|
| `goal` | `string` (≤1000 chars) | |
| `selfAssessedLevel` | `"complete_beginner" \| "some_experience" \| "intermediate"` | |
| `desiredOutcome` | `string` (≤2000 chars) `\| null` | `null` only for legacy incomplete records. |
| `availableMinutesPerWeek` | `number` (15–10080) | |
| `preferredLearningMethods` | `Array<"hands_on_projects" \| "reading_docs" \| "video_walkthroughs" \| "quizzes_drills">` (1–4 unique) `\| null` | `null` only for legacy incomplete records. |
| `createdAt` / `updatedAt` | `string` (ISO-8601) | |

`PUT` is a full create-or-replace, not a patch (FR-010) — the client always
sends all five required fields together; there is no partial-update form for
this entity.

**Departure from current code**: `onboardingSlice.ts` today models
`domain` / `level` / `timeCommitment` / `timeCustomDescription` / `successGoal`
/ `learningPreferences: string[]` — none of these field names or shapes match
the real schema above. The slice (and the onboarding screens' form field
bindings) must be reshaped to the table above, not patched incrementally.

## Onboarding Status (derived, read-only)

| Field | Type | Notes |
|---|---|---|
| `completed` | `boolean` | Authoritative gate for roadmap generation (FR-011). |
| `missingFields` | `Array<"goal" \| "self_assessed_level" \| "desired_outcome" \| "available_minutes_per_week" \| "preferred_learning_methods" \| "resource_language">` | Drives FR-008's "show exactly what's missing." |

Never cached stale across a preferences/learning-profile save — re-fetched
(or invalidated via RTK Query tag) immediately after either mutation
succeeds, per FR-011's "re-check completion... without requiring a full page
reload."

## Roadmap Generation Request

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (ULID) | |
| `status` | `"queued" \| "running" \| "validating" \| "succeeded" \| "failed" \| "cancelled"` | First three are active (poll); last three are terminal (stop polling — FR-014). |
| `roadmapId` | `string \| null` | Set once `status === "succeeded"`. |
| `failureCode` | `string \| null` | Drives FR-023's specific-vs-generic failure explanation. |
| `createdAt` / `startedAt` / `completedAt` | `string (ISO-8601) \| null` | |

Client also tracks, alongside the server fields: the **idempotency key**
used for the in-flight attempt (FR-012 — one key per user click, reused only
for an automatic retry of that same click, never for a new click).

## Roadmap

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (ULID) | |
| `goal` | `string` | |
| `status` | `"draft" \| "generating" \| "validating" \| "ready" \| "active" \| "completed" \| "failed" \| "reset" \| "archived"` | Rendered read-only for this feature (spec Assumptions) — no client-side transitions. |
| `activatedAt` | `string (ISO-8601) \| null` | |
| `currentVersion` | `RoadmapVersion \| null` | |

### RoadmapVersion

| Field | Type |
|---|---|
| `id` | `string` |
| `versionNumber` | `number` |
| `source` | `"generated" \| "regenerated" \| "manual" \| "adaptation"` |
| `status` | `"draft" \| "current" \| "superseded" \| "archived"` |
| `stages` | `Stage[]` (ordered by `position`) |

### Stage

| Field | Type |
|---|---|
| `id` | `string` |
| `title` / `description` | `string` |
| `position` | `number` |
| `status` | `"upcoming" \| "active" \| "completed"` |
| `estimatedMinutes` | `number` |
| `tasks` | `Task[]` (ordered by `position`) |

### Task

| Field | Type |
|---|---|
| `id` | `string` |
| `type` | `"read" \| "watch" \| "quiz" \| "project" \| "assignment" \| "coding_challenge"` |
| `title` / `instructions` | `string` |
| `position` | `number` |
| `status` | `"upcoming" \| "available" \| "current" \| "completed" \| "skip_pending" \| "skipped" \| "replaced"` |
| `isRequired` | `boolean` |
| `estimatedMinutes` | `number` |
| `dependsOnTaskIds` | `string[]` |
| `resources` | `Resource[]` (ordered by `position`, may be empty) |

Task-level action controls (complete/skip) are rendered **disabled**, never
wired to a mutation — no such endpoint exists yet (spec Assumptions, FR-017).

### Resource

| Field | Type |
|---|---|
| `id` | `string` |
| `title` | `string` |
| `url` | `string` |
| `type` | `"documentation" \| "article" \| "video" \| "course"` |
| `position` | `number` |

## State ownership summary

- **`src/lib/api/auth.ts` (module-level, not Redux)**: `Session` (tokens).
- **`authSlice` (Redux, reshaped)**: `User`, `isAuthenticated`.
- **`onboardingSlice` (Redux, reshaped — breaking change from current shape)**:
  `Preferences`, `LearningProfile`, `OnboardingStatus`.
- **RTK Query cache (not hand-written Redux state)**: `RoadmapGenerationRequest`
  (including its idempotency key, held in query/component state, not cache
  data) and `Roadmap`, fetched and cached via the endpoints defined in
  `contracts/api-client.md`.
