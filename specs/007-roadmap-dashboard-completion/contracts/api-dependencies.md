# Contract: API Dependencies for the Dashboard

`API_CONTRACT.md` at the repo root remains the single source of truth. This file only lists which parts of it this feature consumes, and which parts are still missing.

## Consumed as documented (no change)

| Endpoint | Contract | Used for |
|---|---|---|
| `GET /me/onboarding-status` | §13 | The onboarding gate (unchanged) |
| `GET /me/learning-profile` | §12 | The learner's goal in the welcome section (unchanged) |
| `POST /roadmap-generation-requests` | §14 | The Generate action (unchanged; now also invalidates the latest-request cache) |
| `GET /roadmap-generation-requests/{id}` | §15 | Polling an active request (unchanged) |
| `GET /roadmaps/{id}` | §16 | The roadmap tree that every dashboard section derives from |

## Required before Story 1 tasks start: gate G-1 ⚠️

**Retrieving the learner's latest generation request** through the existing `roadmap-generation-requests` resource.

- **Status:** the backend is reported ready (spec Clarifications, 2026-09-24). It is **not yet documented** in `API_CONTRACT.md`.
- **Action:** add a section to `API_CONTRACT.md`, and a row to the §4 endpoint summary, recording the **actual** behavior:

  | # | Needed | Why the frontend needs it |
  |---|---|---|
  | 1 | Method, path and any query parameters (list vs. latest) | The query definition |
  | 2 | Ordering, if it returns a list | To pick the latest request deterministically |
  | 3 | The response when the learner has **no** request (empty list, `404` + code, or `null`) | Maps to the `start` view |
  | 4 | The item representation: is it identical to the §15 resource (`id`, `status`, `roadmap_id`, `failure_code`, ...)? | Reuse of `RoadmapGenerationRequest` |
  | 5 | Error codes (auth, rate limit) | The existing error-category mapping |

- **Frontend rule until G-1 is closed:** no request to this resource is written, and no MSW handler for it is added. Stories 2, 3, 4 and 6 do not depend on G-1 and can proceed, driven by the roadmap that is loaded in-session after generation.

## Not available: task actions (Story 5, deferred)

Endpoints to complete or skip a task **do not exist** (`API_CONTRACT.md` §18). The frontend:

- defines no mutation for them and calls nothing;
- never changes task status locally;
- shows the controls as disabled, with localized "available soon" helper text.

Story 5 is re-planned once these endpoints are added to the contract.
