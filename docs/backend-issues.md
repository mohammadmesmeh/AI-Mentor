# Backend issues found during frontend integration

**For:** the backend developer · **Backend:** `https://masar-startup.onrender.com/api/v1` · **Contract:** `API_CONTRACT.md` (current version) · **Tested:** 2026-09-28, with throwaway accounts and real roadmap generations.

Everything not listed below matched the contract, including: the `{data, meta}` and `{error, meta}` envelopes, every documented error code we could trigger (`learning_profile_not_found`, `active_roadmap_not_found`, `onboarding_incomplete` with `missing_fields`, `too_many_requests`, `roadmap_not_found`, `task_not_found`, `task_completion_conflict`, `unauthenticated`, `validation_failed`), refresh rotation, logout revocation, idempotent re-activation and idempotent task completion.

Request IDs are the `X-Request-ID` values. No tokens are included.

---

## 1. `POST /roadmap-generation-requests` takes about 20 seconds and returns a stale status

**What happened**

| Request | Status | Time | `X-Request-ID` |
| --- | --- | --- | --- |
| `POST /roadmap-generation-requests` (new key) | `202`, body `status: "queued"` | **21.7 s** | `01M3KGV007PXBTCT5ZYVW8SR48` |
| `GET /roadmap-generation-requests/{id}` right after | `200`, `status: "succeeded"` | 1.2 s | `01M3KGWB7CXDF5668JYZ5K0X9N` |

The request only returns after the whole generation has run (`QUEUE_CONNECTION=sync`), yet the body still says `queued`.

**What the contract says** — §15: "The public contract remains asynchronous regardless of whether the deployment uses a synchronous queue driver." §27: "`QUEUE_CONNECTION=sync` is suitable for the current Render free prototype. A dedicated worker is recommended before production-scale AI traffic."

**User impact** — the learner waits ~20 s on one HTTP request. Browsers, proxies or mobile networks may time out, and the frontend cannot show real progress. The response body is also misleading (`queued` for a request that is already finished).

**Suggested change** — run generation on a real queue worker so the POST returns in well under a second. If `sync` must stay for now, return the request's real current status in the POST response.

---

## 2. A second generation silently creates a second roadmap

**What happened** — after the first roadmap had been generated and activated, a new `POST /roadmap-generation-requests` with a different `Idempotency-Key` was accepted (`202`, `X-Request-ID 01M3KGVN4D1V7RRH3PWNM5SBM6`) and produced a second roadmap (`01m3kgvy1vha1tffk932771jdm`, status `ready`, never activated). The learner now owns two roadmaps, and the second can't be listed or found again (see issue 3).

**What the contract says** — §14 only blocks a second request *while another is active* ("Different key while another request is active: `409 roadmap_generation_in_progress`"). §26: "Only one roadmap per user may own `active_slot=1`." Nothing prevents more roadmaps.

**User impact** — in this product version a learner has exactly one roadmap. A double click, a second tab or a retry after a network error creates orphan roadmaps the learner can never reach. The frontend now blocks a second click, but it cannot protect against other tabs or devices.

**Suggested change** — while the one-roadmap rule holds, reject a new generation when the user already has a roadmap (e.g. `409 roadmap_already_exists` with the existing `roadmap_id` in `details`), and document it.

---

## 3. No way to find a `ready` roadmap without its ID

**What happened** — the only discovery endpoint is `GET /me/active-roadmap`. If a roadmap is generated but not activated (activation fails, the tab closes, or the backend doesn't auto-activate), a reload loses its ID for good.

**What the contract says** — §23: "List historical or ready roadmaps without already knowing an ID" does not exist; "Keep IDs for ready/historical roadmaps because only the active roadmap can be rediscovered without an ID."

**User impact** — the dashboard is required to activate the learner's `ready` roadmap on load so they never get stuck on "Create your roadmap" while a roadmap exists. It can only do that in the same session that generated it; after a reload the learner sees "Create your roadmap", and creating one produces a second roadmap (issue 2).

**Suggested change** — add `GET /me/roadmaps` (or `GET /me/latest-roadmap`) returning at least `id`, `status`, `created_at`, newest first.

---

## 4. No data for the mentor insight and recent activity sections

**What happened** — the dashboard has two sections the contract provides no data for: an AI mentor insight and a recent-activity feed. Both currently show an honest "not available yet" state.

**What the contract says** — §23: "AI mentor chat" and "Evidence uploads, certificates, streaks, analytics, notifications, gamification" do not exist. There is no activity or event endpoint either (task completion only returns the roadmap).

Also, the roadmap tree (`GET /me/active-roadmap`, `GET /roadmaps/{id}`) has no `completed_at` on its tasks. It exists only on `GET /tasks/{id}` (§19), so even a simple "recently completed" list would need one request per completed task. Checked on 2026-09-28: task keys in the active roadmap are `id, type, title, instructions, position, status, is_required, estimated_minutes, depends_on_task_ids, resources`.

**User impact** — two of the dashboard's six sections are always empty.

**Suggested change** — when planned: an activity endpoint (e.g. `GET /me/activity?limit=10` with task completions and stage changes, each with a timestamp), and an insight endpoint (or a field on the active roadmap). In the meantime, adding `completed_at` to tasks in the roadmap resource would let the frontend show recent completions without extra requests.

---

## 5. Slow endpoints

Measured from the frontend's region (Render, warm instance):

| Endpoint | Typical time |
| --- | --- |
| `POST /tasks/{id}/complete` | **5.1–5.8 s** |
| `GET /tasks/{id}` | 3.0 s |
| `POST /auth/register` | 4.4 s |
| `GET /me/active-roadmap`, `GET /roadmaps/{id}` | 2.2–2.5 s |
| Other `GET /me/*` | 1.1–1.5 s |
| `POST /roadmap-generation-requests` | ~20 s (issue 1) |

**User impact** — "Mark complete" takes about 5 seconds to confirm; the dashboard takes 4–5 s to load (onboarding status, then the active roadmap). A cold start adds much more.

**Suggested change** — profile task completion (it locks and rewrites the tree) and the roadmap resource serialization (likely N+1 queries across stages, tasks, dependencies and resources).

---

## 6. `409 task_completion_conflict` has no `details`

**What happened** — completing a task that isn't available yet: `409`, body `{"error": {"code": "task_completion_conflict", "message": "…"}}` with no `details`.

**What the contract says** — §2, common error codes: "`409` | Endpoint-specific conflict | Read `error.details` and show the relevant recovery action."

**User impact** — the frontend can't say *why* (roadmap not active, task locked by a dependency, task already skipped, not in the current version), so it shows a generic "this task can't be completed right now" and re-reads the roadmap.

**Suggested change** — add `details.reason` (e.g. `roadmap_not_active`, `dependencies_incomplete`, `task_not_available`, `not_current_version`) and, for dependencies, `details.blocking_task_ids`. Or document that this 409 has no details.

---

## 7. "Watch" tasks never get a video, and many resources are site homepages

**What happened** — we checked every resource of five generated roadmaps (Git ×4, React ×1; 45 resources). Every URL loads (HTTP 200), so no link is broken. But:

- **No resource has `type: "video"`.** Tasks of type `watch` get `documentation` resources pointing at pages that are not videos. This happened even for a learner whose only preferred method is `video_walkthroughs` (React roadmap generated 2026-09-28).

  | Task type | Resource type | URL |
  | --- | --- | --- |
  | `watch` | `documentation` | `https://git-scm.com/downloads` (a download page) |
  | `watch` | `documentation` | `https://docs.github.com/` |
  | `watch` | `documentation` | `https://git-scm.com/doc` |
  | `watch` | `documentation` | `https://react.dev/learn` |

- **Many resources are homepages, not the material the task names:** `https://github.com/` for a "Publishing a Small Project" project task, `https://git-scm.com/` for an assignment, `https://react.dev/` for a reading task. The same URL is often reused for several unrelated tasks in one roadmap (`https://react.dev/learn` appears 4 times out of 9).
- `https://guides.github.com/` redirects to `https://docs.github.com/en` (an outdated link).

**What the contract says** — §16 lists resource types `documentation`, `article`, `video`, `course` and task types including `watch`. It says nothing about matching them, but a `watch` task implies a video.

**User impact** — learners report that "video links don't work": the link opens, but it's a download page or a docs index, not a video. The frontend shows the resource's real type ("Documentation"), so the mismatch is visible but confusing.

**Suggested change** — in generation validation, require at least one `video` resource for `watch` tasks (or don't generate `watch` tasks without one). Reject bare homepages as resources, and prefer deep links specific to the task. If videos can't be guaranteed, don't generate `watch` tasks.

---

## Note: rate limits and the frontend's session route

To keep learners signed in across reloads, the frontend now follows §3 rule 4: a Next.js route stores the refresh token in an HttpOnly cookie and calls `POST /auth/refresh` **from the frontend server**. Login and register still go from the browser.

§25 limits `POST /auth/refresh` to **10 per minute per IP**. Every learner's refresh now comes from the frontend server's IP, so with more than a handful of active learners they share one limit. The route sends the learner's IP in `X-Forwarded-For`.

**Please confirm** — does the backend trust `X-Forwarded-For` from the frontend's host for rate limiting? If not, either trust it for known frontend origins, or key the refresh limit on the refresh-token family instead of the IP.
