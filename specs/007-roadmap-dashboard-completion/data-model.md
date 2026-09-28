# Data Model: Roadmap-Driven Dashboard Completion

This feature adds **no persisted client state**. The server entities below come from `API_CONTRACT.md` §15–16 and are already typed in `src/lib/api/types.ts`. The derived view models are computed per render from those entities and are never stored.

## Server entities (read-only here)

### RoadmapGenerationRequest (existing type)

| Field | Notes |
|---|---|
| `id` | The request identifier |
| `status` | `queued` \| `running` \| `validating` (active); `succeeded` \| `failed` \| `cancelled` (terminal) |
| `roadmapId` | Set when `succeeded` |
| `failureCode` | Set when `failed`; mapped to a message by the existing failure component |
| `createdAt`, `startedAt`, `completedAt` | Timestamps |

The **latest** request for the learner is obtained through R-1. Its item shape is assumed to equal this type, which must be verified at gate G-1.

### Roadmap (existing type)

| Field | Notes |
|---|---|
| `id`, `goal` | |
| `status` | `draft`, `generating`, `validating`, `ready`, `active`, `completed`, `failed`, `reset`, `archived` |
| `currentVersion` | A `RoadmapVersion` or `null` |

### RoadmapVersion, Stage, Task and Resource (existing types)

- **Version:** holds `stages[]`.
- **Stage:**
  - `id`, `title`, `description`
  - `position`
  - `status`: `upcoming` \| `active` \| `completed`
  - `estimatedMinutes`
  - `tasks[]`
- **Task:**
  - `id`, `type`, `title`, `instructions`
  - `position`
  - `status`: `upcoming` \| `available` \| `current` \| `completed` \| `skip_pending` \| `skipped` \| `replaced`
  - `isRequired`, `estimatedMinutes`
  - `dependsOnTaskIds[]`, `resources[]`
- **Resource:** `id`, `title`, `url` (untrusted), `type`, `position`.

Stages, tasks and resources are always consumed sorted by `position`.

## Derived view models (`src/features/dashboard/lib/`)

### DashboardView (from R-2)

A discriminated union on `view`:

```text
loading
onboarding-incomplete { missingFields }
start
start-error
generating
timed-out
failed { failureCode }
roadmap-not-ready
roadmap-inactive
ready { roadmap }
load-error { retry }
```

**Resolution order.** The first matching rule wins:

1. Onboarding status is loading → `loading`.
2. Onboarding is incomplete → `onboarding-incomplete`.
3. Generating could not be started → `start-error`.
4. The **effective request** is:
   - the in-session request, if the learner clicked Generate in this session;
   - otherwise, the latest request from the server.
5. The latest request query is loading and there is no in-session request → `loading`.
6. The latest request query errored and there is no in-session request → `load-error`.
7. There is no effective request, or it is `cancelled` → `start`.
8. It is active → `generating`, or `timed-out` once polling times out.
9. It is `failed` → `failed`.
10. It is `succeeded`: the roadmap query decides:
    - loading → `loading`;
    - error → `load-error`;
    - status `draft`, `generating` or `validating`, or no current version → `roadmap-not-ready`;
    - status `reset`, `archived` or `failed` → `roadmap-inactive`;
    - otherwise → `ready`.

**Invariant (FR-002):** `start` is only reachable through rule 7, which requires the server to have returned "no request" or a cancelled one. A load error can never produce `start`.

### CurrentTaskRef (from `findCurrentTask`)

`{ task: RoadmapTask; stage: RoadmapStage } | null`

The rules:
1. The first task, in roadmap order, with status `current`.
2. Otherwise, the first task with status `available`, searching the `active` stage first and then the stages after it in order.
3. Otherwise, `null`.

### FocusTask list (from `focusTasks`)

- Up to 3 `CurrentTaskRef` items: the current task first, then the remaining `current`/`available` tasks in roadmap order.
- No duplicates.
- Empty when nothing is actionable.

### RoadmapProgress (from `roadmapProgress`)

| Field | Rule |
|---|---|
| `stageCount` | The number of stages |
| `stageNumber` | The 1-based index of the `active` stage. If none is active: the first stage that isn't completed; if all are completed, `stageCount`. |
| `countedTasks` | Tasks whose status is not `replaced` |
| `completedTasks` | Counted tasks with status `completed` |
| `percent` | `floor(completedTasks / countedTasks * 100)`, or 0 when `countedTasks` is 0 |
| `allCompleted` | `countedTasks > 0` and every counted task is `completed` or `skipped` |
| `stageStatuses` | `{ id, title, status }[]` in position order |

Skipped tasks count toward the total but not as completed. That's why `allCompleted` accepts `skipped`, so a learner who skipped the last task still sees completion, while `percent` stays honest (spec Assumptions).

### ContinueLearning state

| Case | Shows |
|---|---|
| `CurrentTaskRef` present | The task: its title, localized type, localized duration, stage title and an `#task-<id>` action |
| `allCompleted` | The completion message; no action to a task |
| Otherwise | The honest "nothing to start right now" message, with the action pointing to `#roadmap` |

### SafeResourceLink (from `safeExternalUrl`)

`{ title, href: string | null }`. `href` is non-null only for `http:` and `https:` URLs that parse.
