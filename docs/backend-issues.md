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

## 8. No account management: password, name/email, deletion

**What happened** — the new Profile and Settings pages can show the account (`GET /me`) and edit preferences (`PATCH /me/preferences`) and the learning profile (`PUT /me/learning-profile`). Nothing else about the account can be changed. The pages leave these features out rather than showing controls that do nothing.

**What the contract says** — §23: "Password reset or email verification" and "Update account name/email/password" do not exist. There is no account-deletion endpoint at all. §10 lists `deletion_requested` as a possible user `status`, but nothing can set it.

**User impact** — a learner can't:
- change their password, even when they know the current one;
- recover a forgotten password (the sign-in page's "Forgot your password?" can only show a "not connected" message);
- fix a typo in their name or change their email;
- delete their account or request its deletion. Many privacy regulations expect this to be possible.

**Suggested change**, in priority order:
1. `POST /me/password` with `{current_password, password, password_confirmation}`, revoking other refresh tokens.
2. `POST /auth/password/forgot` and `POST /auth/password/reset`.
3. `PATCH /me` for `name`; email change with verification.
4. `DELETE /me` or `POST /me/deletion-request`, re-authenticated, which sets `deletion_requested`.

---

## 9. Existing learners are sent back to onboarding by the new `preferred_resource_sources`

**What happened** — after the contract update that made `preferred_resource_sources` a required learning-profile field, every learner created before the change has it as `null`. The backend now reports them as not onboarded, even when they already have an active roadmap. Checked on 2026-09-29 with a test account created on 2026-09-28:

| Request | Status | Response (tokens removed) | `X-Request-ID` |
| --- | --- | --- | --- |
| `GET /me/onboarding-status` | `200` | `{"completed": false, "missing_fields": ["preferred_resource_sources"]}` | `01M3PPS67AS9ETB4DPS82J20H6` |
| `GET /me/learning-profile` | `200` | `… "preferred_resource_sources": null …` | `01M3PPSB4M2K52FF5MWSSZ759G` |
| `GET /me/active-roadmap` | `200` | the learner's active roadmap | — |

A new account also shows why saves failed before the frontend was updated: `PUT /me/learning-profile` with the five previous fields → `422 validation_failed`, `details: {"preferred_resource_sources": ["The preferred resource sources field is required."]}` (`X-Request-ID 01M3PPPZC261X9W3PTDQM8V4KQ`). With the sixth field it returns `201` (`01M3PPQ68RQ27PGXBD9P3MJB49`).

**What the contract says** — §12: "Legacy incomplete records can return … `preferred_resource_sources` as `null`", and "All six fields are required". §13 lists `preferred_resource_sources` among the `missing_fields`. §22: "Do not enable roadmap generation until `completed` is `true`", and the learning flow starts from `completed=true`. §15: "Legacy version-1 queued requests remain readable and default to official documentation behavior."

**User impact** — a learner who was already learning is suddenly told to finish onboarding before they can see their roadmap again. The frontend follows the contract (onboarding status gates the workspace), so these learners must re-submit their learning profile once to pick sources. Nothing is lost, but it's a surprising interruption for every existing user.

**Suggested change** — migrate legacy profiles with `preferred_resource_sources = ["official_documentation"]`, the same default §15 already uses for version-1 snapshots, so existing learners stay `completed: true`. Alternatively, don't count the field as missing for learners who already have a roadmap.

---

## 10. Selecting YouTube as a source makes every roadmap generation fail

**What happened** — with the frontend sending the new field, generation succeeds or fails depending only on the selected sources. Same goal, level, outcome, time and formats each time; fresh accounts; 2026-09-29:

| `preferred_resource_sources` | Generation result | POST `X-Request-ID` | Generation request |
| --- | --- | --- | --- |
| `["youtube"]` | `failed`, `failure_code: "roadmap_provider_failed"` (≈37 s) | `01M3PS5FK01ZNDDEXW132AXAB6` | `01m3ps5hpdxexpcg9haffqj989` |
| `["courses", "youtube"]` (through the UI) | `failed`, `roadmap_provider_failed` | — | — |
| `["official_documentation"]` | `succeeded`, resources: `documentation` | `01M3PS6SDRYMB7S5CVNHPPN3MF` | `01m3ps6vhq08rshzs1pwmjpgt5` |
| `["articles", "courses"]` | `succeeded`, resources: `documentation` and `course` (no `article`) | `01M3PS8B4M11FZEE5QFZ1YG9HD` | `01m3ps8d8te3h21p9gs06ncm39` |

**What the contract says** — §15: "When `youtube` is selected, the backend discards generated video URLs and searches YouTube Data API v3 once per task … Empty results or provider failures terminate safely as `roadmap_provider_failed`." It also says "resource types follow the selected source list". §27 adds `YOUTUBE_API_KEY=<secret>` and the other `YOUTUBE_*` settings.

**User impact** — any learner who picks YouTube — the obvious choice for someone who prefers videos — can't get a roadmap at all. They see "The AI service couldn't create your roadmap this time", and retrying fails the same way. Separately, a learner who picks articles gets documentation instead.

**Suggested change** — check that `YOUTUBE_API_KEY` (and the other `YOUTUBE_*` values) are set on Render and the key has YouTube Data API v3 enabled with quota. Consider failing only the tasks without a video (falling back to the learner's next source in priority order) instead of the whole roadmap. Also check that `articles` produces `article` resources.

---

## 11. The refresh rate limit is shared by every learner, and its 429 has no `Retry-After`

**Context** — to keep learners signed in across reloads, the frontend follows §3 rule 4: a Next.js route stores the refresh token in an HttpOnly cookie and calls `POST /auth/refresh` **from the frontend server**. Login and register still go from the browser. §25 limits `POST /auth/refresh` to **10 per minute per IP**, so every learner's refresh now counts against the frontend server's IP. With more than a handful of learners reloading, they get `429` and the app can't restore their session.

**What we measured** (2026-10-03, ~07:30 UTC, with an invalid refresh token so no session was touched):

- The limit counts every call, including rejected ones (`401`/`422`). After about 10 calls in a minute: `429 too_many_requests`, "Too Many Attempts." (`X-Request-ID 01M40B26Y8G7B0EY8NFJKPFVVB`).
- **The 429 has no `Retry-After`** and no `X-RateLimit-*` headers. The successful calls do send `X-RateLimit-Remaining`. §2 says to honor `Retry-After` "if present"; the client can only guess the wait.
- **`X-Forwarded-For` is not trusted:** calls with `X-Forwarded-For: 203.0.113.50` / `203.0.113.51` were counted against the caller's own IP (`X-RateLimit-Remaining` kept falling; `X-Request-ID 01M40AQDWRF4PK0PTFQ5W356Y1`, `01M40AQE3DETW73Z2V849EXVG7`). The session route sends the learner's IP in that header, but the backend keys the limit on the frontend server's IP.
- **The counter looks per instance:** in a quick burst `X-RateLimit-Remaining` went 9, 9, 8, 7, 6, 5, 8, 7, 4 … and some calls passed after others had already been limited (`#21 401`, `#23 401` between `429`s). The effective limit is unpredictable.

**What the frontend does now** — one restore per page load; concurrent refreshes share one request (also across tabs, and the session route reuses a just-made refresh for a tab that restores right after); on `429` the learner is not signed out, the app waits `Retry-After` (10 s when it is missing), retries once, and otherwise shows "We couldn't reach Khatwa" with a retry button. Read requests no longer retry a `429` automatically.

**Please** — (1) trust `X-Forwarded-For` from the frontend's host (Vercel) for the refresh limit, or key that limit on the refresh-token family instead of the IP; (2) send `Retry-After` with `429` responses; (3) keep the rate-limit counter in a shared store so all instances agree.
