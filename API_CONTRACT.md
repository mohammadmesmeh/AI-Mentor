# Masar / AI Mentor Backend API Contract

This is the canonical frontend integration contract for the API implemented in
this repository. It documents current behavior only. If this document and the
running API disagree, the running API is authoritative and this file must be
updated in the same change.

## 1. Connection

| Environment | Base URL |
| --- | --- |
| Local | `http://localhost:8000/api/v1` |
| Production | `https://masar-startup.onrender.com/api/v1` |

Recommended frontend variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://masar-startup.onrender.com/api/v1
```

Do not append another `/api/v1`, and avoid a trailing slash.

Every request should send:

```http
Accept: application/json
```

Requests with a JSON body must also send:

```http
Content-Type: application/json
```

Protected endpoints additionally require:

```http
Authorization: Bearer <access_token>
```

The API uses bearer JWT authentication. It does **not** use cookies, Sanctum,
CSRF, or `/sanctum/csrf-cookie`.

## 2. Shared response contract

Successful JSON responses use:

```json
{
  "data": {},
  "meta": {
    "request_id": "01..."
  }
}
```

Error responses use:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The given data was invalid.",
    "details": {
      "field": ["Validation message."]
    }
  },
  "meta": {
    "request_id": "01..."
  }
}
```

`error.details` is optional. Display a friendly localized message based on
`error.code`; keep `meta.request_id` for support and diagnostics. Do not build
UI behavior by matching the English `message` text.

The server generates a new ULID for every request. Client-supplied
`X-Request-ID` values are not adopted. Every response includes:

```http
X-Request-ID: 01...
```

IDs are ULID strings. Dates are ISO-8601 UTC strings or `null`.

### Common error codes

| HTTP | `error.code` | Frontend behavior |
| --- | --- | --- |
| `401` | `unauthenticated` | Attempt one serialized refresh; otherwise sign out. |
| `403` | `forbidden` | Show an access-denied state. |
| `404` | Endpoint-specific or `not_found` | Show not found; do not reveal ownership. |
| `409` | Endpoint-specific conflict | Read `error.details` and show the relevant recovery action. |
| `422` | `validation_failed` | Map `error.details.<field>` to form fields. |
| `429` | `too_many_requests` | Disable retry temporarily; honor `Retry-After` if present. |
| `503` | `authentication_service_unavailable` | Show a temporary-service error; do not clear tokens immediately. |
| `500` | `internal_error` | Show a generic retry state and retain `request_id`. |

Endpoint-specific codes currently include `user_preferences_not_found`,
`learning_profile_not_found`, `roadmap_generation_request_not_found`,
`roadmap_not_found`, `active_roadmap_not_found`, `task_not_found`,
`onboarding_incomplete`, `roadmap_generation_in_progress`,
`roadmap_activation_conflict`, and `task_completion_conflict`.

## 3. Authentication and token handling

An authentication response has this shape:

```json
{
  "data": {
    "token_type": "Bearer",
    "access_token": "eyJ...",
    "expires_in": 900,
    "refresh_token": "opaque-64-character-token",
    "refresh_expires_in": 2592000,
    "user": {
      "id": "01...",
      "name": "Mohammad",
      "email": "user@example.com",
      "status": "active",
      "email_verified_at": null,
      "last_login_at": null,
      "created_at": "2026-09-10T09:22:11.000000Z"
    }
  },
  "meta": {
    "request_id": "01..."
  }
}
```

`access_token` normally lasts 15 minutes. `refresh_token` normally lasts 30
days and is rotated on every successful refresh.

Frontend rules:

1. Never put either token in a URL, log, analytics event, or error report.
2. Do not persist the refresh token in `localStorage`.
3. For a direct-browser MVP, keep tokens in memory; a reload signs the user out.
4. For persistent browser sessions, use a Next.js server/BFF with an `HttpOnly`,
   `Secure`, `SameSite` cookie instead of exposing the refresh token to browser
   JavaScript.
5. Only one refresh request may run at a time. All failed API calls must await
   the same in-flight refresh promise. Concurrent refreshes can trigger refresh
   reuse detection and revoke the whole token family.
6. After refresh, atomically replace **both** stored tokens, then retry the
   original request once. Never create an infinite refresh loop.
7. On logout, clear frontend auth state even if the network request fails.

Token responses include `Cache-Control: no-store` and `Pragma: no-cache`.

## 4. Endpoint summary

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| `GET` | `/health` | No | `200` |
| `POST` | `/auth/register` | No | `201` |
| `POST` | `/auth/login` | No | `200` |
| `POST` | `/auth/refresh` | No | `200` |
| `POST` | `/auth/logout` | Bearer | `204` |
| `GET` | `/me` | Bearer | `200` |
| `GET` | `/me/preferences` | Bearer | `200` |
| `PATCH` | `/me/preferences` | Bearer | `200` |
| `GET` | `/me/learning-profile` | Bearer | `200` |
| `PUT` | `/me/learning-profile` | Bearer | `201` first time, then `200` |
| `GET` | `/me/onboarding-status` | Bearer | `200` |
| `GET` | `/me/active-roadmap` | Bearer | `200` |
| `POST` | `/roadmap-generation-requests` | Bearer + idempotency | `202` or replay `200` |
| `GET` | `/roadmap-generation-requests/{id}` | Bearer | `200` |
| `GET` | `/roadmaps/{id}` | Bearer | `200` |
| `POST` | `/roadmaps/{id}/activate` | Bearer | `200` |
| `GET` | `/tasks/{id}` | Bearer | `200` |
| `POST` | `/tasks/{id}/complete` | Bearer | `200` |

## 5. Health

### `GET /health`

```json
{
  "data": {
    "status": "ok",
    "service": "ai-mentor-backend"
  },
  "meta": {
    "request_id": "01..."
  }
}
```

## 6. Register

### `POST /auth/register`

```json
{
  "name": "Mohammad",
  "email": "user@example.com",
  "password": "Secret123!",
  "password_confirmation": "Secret123!"
}
```

Validation:

- `name`: required string, maximum 120 characters.
- `email`: required valid email, maximum 255 characters, unique.
- `password`: required, minimum 8 characters.
- `password_confirmation`: must match `password`.
- Extra fields are rejected.

Returns `201` with the authentication response. New users receive default
preferences: `ui_locale=en`, `resource_language=both`.

Possible failures: `422 validation_failed`, `429 too_many_requests`. Registration
is limited to 3 attempts per IP per minute.

## 7. Login

### `POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "Secret123!"
}
```

Returns `200` with the authentication response. Invalid credentials and
inactive accounts intentionally return the same generic `422 validation_failed`
response.

Possible failures: `422 validation_failed`, `429 too_many_requests`. Login is
limited to 5 attempts per normalized email/IP per minute.

## 8. Refresh authentication

### `POST /auth/refresh`

No bearer header is required.

```json
{
  "refresh_token": "current-refresh-token"
}
```

Returns `200` with a new authentication response. Immediately discard the old
access and refresh tokens and store the returned pair atomically.

Possible failures:

- `422 validation_failed`: missing or malformed token.
- `401 unauthenticated`: invalid, expired, revoked, or reused token; sign out.
- `429 too_many_requests`: limited to 10 attempts per IP per minute.
- `503 authentication_service_unavailable`: temporary Redis failure.

## 9. Logout

### `POST /auth/logout`

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "refresh_token": "current-refresh-token"
}
```

Returns `204 No Content`. There is no response body.

## 10. Current user

### `GET /me`

Returns `200`:

```json
{
  "data": {
    "id": "01...",
    "name": "Mohammad",
    "email": "user@example.com",
    "status": "active",
    "email_verified_at": null,
    "last_login_at": "2026-09-10T09:30:00.000000Z",
    "created_at": "2026-09-10T09:22:11.000000Z"
  },
  "meta": {
    "request_id": "01..."
  }
}
```

`status` can be `active`, `suspended`, or `deletion_requested`, although only
active users can authenticate successfully.

## 11. Preferences

### `GET /me/preferences`

Returns `200`:

```json
{
  "data": {
    "ui_locale": "ar",
    "resource_language": "both",
    "updated_at": "2026-09-10T09:31:14.000000Z"
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Possible failure: `404 user_preferences_not_found` for a legacy user without a
preferences row.

### `PATCH /me/preferences`

Send at least one field. Omitted fields keep their current value.

```json
{
  "ui_locale": "ar",
  "resource_language": "ar"
}
```

Allowed values:

- `ui_locale`: `ar` or `en`.
- `resource_language`: `ar`, `en`, or `both`.

Timezone is no longer returned or selected by the learner. The database column
is retained for existing records; application timestamps remain UTC. For older
clients only, a valid IANA `timezone` (maximum 64 characters) is accepted and
ignored. New clients must omit it and remove timezone controls from onboarding,
review, and settings.

Returns `200` with the preference response. Extra fields and an empty update
are rejected with `422 validation_failed`.

## 12. Learning profile

### `GET /me/learning-profile`

Returns `200`, or `404 learning_profile_not_found` when it does not exist.

```json
{
  "data": {
    "id": "01...",
    "goal": "Learn Laravel architecture",
    "self_assessed_level": "some_experience",
    "desired_outcome": "Build a maintainable backend",
    "available_minutes_per_week": 360,
    "preferred_learning_methods": [
      "hands_on_projects",
      "reading_docs"
    ],
    "preferred_resource_sources": [
      "official_documentation"
    ],
    "created_at": "2026-09-10T09:43:04.000000Z",
    "updated_at": "2026-09-10T09:43:04.000000Z"
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Legacy incomplete records can return `desired_outcome` or
`preferred_learning_methods` as `null`. Derived `preferred_resource_sources`
is `null` when learning methods are missing, not when historical stored sources
are missing.

### `PUT /me/learning-profile`

This is an idempotent create-or-replace operation, not a partial update.

```json
{
  "goal": "Learn Laravel architecture",
  "self_assessed_level": "some_experience",
  "desired_outcome": "Build a maintainable backend",
  "available_minutes_per_week": 360,
  "preferred_learning_methods": [
    "hands_on_projects",
    "reading_docs"
  ]
}
```

Validation:

- All five fields in the request example are required.
- `goal`: maximum 1,000 characters.
- `desired_outcome`: maximum 2,000 characters.
- `available_minutes_per_week`: integer from 15 to 10,080.
- `self_assessed_level`: `complete_beginner`, `some_experience`, or
  `intermediate`.
- `preferred_learning_methods`: 1-4 unique values from
  `hands_on_projects`, `reading_docs`, `video_walkthroughs`, `quizzes_drills`.
- `preferred_resource_sources` is derived by the server and must not be offered
  as a second choice. Older clients may send 1-4 unique values from `youtube`,
  `official_documentation`, `articles`, and `courses`; these values are validated
  but ignored when saving and generating a new roadmap.
- Extra fields are rejected.

Returns `201` when created and `200` on later replacements. Both return the
learning-profile response.

Resource derivation follows the selected learning methods, in selection order:

| Learning method | Behavior |
| --- | --- |
| `video_walkthroughs` | Verified YouTube video resources. |
| `reading_docs` | Official documentation resources. |
| `hands_on_projects` | Practical project/assignment tasks, not a separate source choice. |
| `quizzes_drills` | Quiz/exercise tasks, not a separate source choice. |

When only practice and/or quizzes are selected, official documentation supplies
supporting resources. Sources are unique. GET still exposes
`preferred_resource_sources` as derived output for client compatibility; it is
not an editable answer. Existing profiles use this same derivation without
requiring the learner to repeat onboarding. Already submitted generation
snapshots and existing roadmaps retain their original data.

Frontend requirement: show only the four learning methods, remove the separate
source selector and source review row, and submit the five request fields above.

## 13. Onboarding status

### `GET /me/onboarding-status`

```json
{
  "data": {
    "completed": false,
    "missing_fields": ["desired_outcome"]
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Possible `missing_fields` values:

```text
goal
self_assessed_level
desired_outcome
available_minutes_per_week
preferred_learning_methods
resource_language
```

Do not enable roadmap generation until `completed` is `true`.

## 14. Request roadmap generation

### `POST /roadmap-generation-requests`

Required headers:

```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
Idempotency-Key: <unique-attempt-key>
```

The body must be an empty JSON object:

```json
{}
```

Generate one stable key per user action and reuse it only when retrying that
same action after a timeout or network failure. A UUID is suitable. The key
must contain 8-128 safe ASCII characters matching letters, numbers, `.`, `_`,
`:`, or `-`, and must start with a letter or number.

A new request returns `202`:

```json
{
  "data": {
    "id": "01...",
    "status": "queued",
    "roadmap_id": null,
    "failure_code": null,
    "created_at": "2026-09-10T09:46:59.000000Z",
    "started_at": null,
    "completed_at": null,
    "status_url": "http://localhost:8000/api/v1/roadmap-generation-requests/01...",
    "roadmap_url": null
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Response headers also include `Location` and `Idempotency-Replayed`. The current
CORS configuration exposes only `X-Request-ID`, so browser code must not depend
on reading those two headers. The response body contains everything required.

Idempotency behavior:

- New request: `202`, same request body, job queued.
- Replay while active: `202`, same request returned, no duplicate job.
- Replay after terminal state: `200`, same request returned.
- Different key while another request is active: `409
  roadmap_generation_in_progress` with `generation_request_id`.

Possible failures:

```json
{
  "error": {
    "code": "onboarding_incomplete",
    "message": "Complete onboarding before requesting roadmap generation.",
    "details": {
      "missing_fields": ["goal"]
    }
  },
  "meta": {
    "request_id": "01..."
  }
}
```

| HTTP | Code | Meaning |
| --- | --- | --- |
| `409` | `onboarding_incomplete` | Return the user to incomplete onboarding fields. |
| `409` | `roadmap_generation_in_progress` | Resume polling the returned request ID. |
| `422` | `validation_failed` | Missing/invalid idempotency key or non-empty body. |
| `429` | `too_many_requests` | Limit is 3 attempts per authenticated user/minute. |

## 15. Poll generation status

### `GET /roadmap-generation-requests/{generationRequest}`

The authenticated user must own the request. Unknown and foreign IDs both
return `404 roadmap_generation_request_not_found`.

Statuses:

```text
Active:   queued → running → validating
Terminal: succeeded | failed | cancelled
```

Successful terminal response:

```json
{
  "data": {
    "id": "01...",
    "status": "succeeded",
    "roadmap_id": "01...",
    "failure_code": null,
    "created_at": "2026-09-10T09:46:59.000000Z",
    "started_at": "2026-09-10T09:46:59.000000Z",
    "completed_at": "2026-09-10T09:47:00.000000Z",
    "status_url": "http://localhost:8000/api/v1/roadmap-generation-requests/01...",
    "roadmap_url": "http://localhost:8000/api/v1/roadmaps/01..."
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Polling rules:

1. Poll by API path/ID, not by blindly trusting the absolute returned URL.
2. Start around every 1 second, then back off to 2-3 seconds.
3. Stop immediately on any terminal status.
4. Stop after a reasonable UI timeout and offer "check again"; do not create a
   new generation request merely because polling timed out.
5. On `succeeded`, navigate using `roadmap_id`.
6. On `failed`, show a retry action that creates a **new** idempotency key.
7. On `cancelled`, return to the generation screen.

Production can use Google Gemini through the Interactions API. The public
contract remains asynchronous regardless of whether the deployment uses a
synchronous queue driver. Gemini calls use structured output and `store=false`.
Only the immutable learning snapshot is submitted; user identity and tokens are
excluded. Provider/model details and provider response bodies are not public.
The snapshot schema is version 2 and includes `preferred_resource_sources`.
Legacy version-1 queued requests remain readable and default to official
documentation behavior.

Generation treats `goal` and `desired_outcome` as a strict scope boundary and
starts from `self_assessed_level`. For example, an intermediate frontend goal
must remain frontend, omit unrelated backend/DevOps topics, and continue from
intermediate material instead of restarting beginner fundamentals unless a
named prerequisite is essential. Task formats follow
`preferred_learning_methods`; resource types follow the server-derived source list.

When `youtube` is selected, the backend discards generated video URLs and
searches YouTube Data API v3 for each task. It requests the most-viewed matching
candidates, reads each video's public `viewCount`, reads each channel's public
`subscriberCount`, and combines both signals for the final popularity order.
Arabic preferences keep Arabic videos, English preferences keep English videos,
and `both` searches Arabic first before filling remaining resource slots with
English results. Searches use strict safe search and the configured recent
window (five years by default); when that window has insufficient matching
results, the backend retries without the date limit. Only returned 11-character
video IDs become canonical `https://www.youtube.com/watch?v=...` resources.
Exhausted searches or provider failures terminate safely as
`roadmap_provider_failed`; invented fallback links are never persisted.

Possible public `failure_code` values are `invalid_generated_roadmap`,
`roadmap_provider_failed`, and `roadmap_generation_failed`. On provider failure,
create a new request with a new idempotency key. The backend never returns the
prompt, raw provider response, validated output, snapshot, hashes, provider
metadata, token counts, or internal failure message.

## 16. Get roadmap

### `GET /roadmaps/{roadmap}`

The authenticated user must own the roadmap. Unknown and foreign IDs both
return `404 roadmap_not_found`.

Representative response:

```json
{
  "data": {
    "id": "01...",
    "goal": "تعلم Laravel",
    "status": "active",
    "activated_at": "2026-09-10T09:47:00.000000Z",
    "completed_at": null,
    "progress": {
      "completed_tasks": 1,
      "total_tasks": 9,
      "percentage": 11
    },
    "current_version": {
      "id": "01...",
      "version_number": 1,
      "source": "generated",
      "status": "current",
      "stages": [
        {
          "id": "01...",
          "title": "الأساسيات",
          "description": "ابدأ بالمفاهيم الأساسية.",
          "position": 1,
          "status": "active",
          "estimated_minutes": 120,
          "progress": {
            "completed_tasks": 1,
            "total_tasks": 3,
            "percentage": 33
          },
          "tasks": [
            {
              "id": "01...",
              "type": "read",
              "title": "دراسة المفاهيم",
              "instructions": "اقرأ وطبّق المفاهيم الأساسية.",
              "position": 1,
              "status": "available",
              "is_required": true,
              "estimated_minutes": 40,
              "depends_on_task_ids": [],
              "resources": [
                {
                  "id": "01...",
                  "title": "Laravel Documentation",
                  "url": "https://laravel.com/docs",
                  "type": "documentation",
                  "position": 1
                }
              ]
            }
          ]
        }
      ]
    },
    "created_at": "2026-09-10T09:47:00.000000Z",
    "updated_at": "2026-09-10T09:47:00.000000Z"
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Values currently possible in the response:

| Field | Values |
| --- | --- |
| Roadmap status | `draft`, `generating`, `validating`, `ready`, `active`, `completed`, `failed`, `reset`, `archived` |
| Version source | `generated`, `regenerated`, `manual`, `adaptation` |
| Version status | `draft`, `current`, `superseded`, `archived` |
| Stage status | `upcoming`, `active`, `completed` |
| Task status | `upcoming`, `available`, `current`, `completed`, `skip_pending`, `skipped`, `replaced` |
| Task type | `read`, `watch`, `quiz`, `project`, `assignment`, `coding_challenge` |
| Resource type | `documentation`, `article`, `video`, `course` |

`current_version` may be `null`. A legacy task can return `resources: []`.
Sort stages, tasks, and resources by `position`; the API already returns them in
that order, but treating `position` as authoritative is safest.

Progress counts only tasks with `is_required=true`. It is calculated at response
time and is never accepted from the client. Percentage is the floored integer
`completed_tasks / total_tasks * 100`; a zero total returns zero percent.

The authenticated user must own the roadmap. Unknown and foreign IDs both
return `404 roadmap_not_found`.

## 17. Get the active roadmap

### `GET /me/active-roadmap`

Returns `200` with the same complete roadmap resource documented above for the
authenticated user's roadmap whose `active_slot=1`. If no roadmap is currently
active, returns `404 active_roadmap_not_found`. A completed roadmap has its
active slot cleared and is therefore no longer returned here.

## 18. Activate a roadmap

### `POST /roadmaps/{roadmap}/activate`

The authenticated user must own the URL ID. Missing and foreign IDs both return
`404 roadmap_not_found`. The request supplies no lifecycle state or timestamps.

Only `ready` and `active` roadmaps can be activated. Other states return `409
roadmap_activation_conflict`. Activation is transactional and:

1. clears the prior roadmap's active slot and changes it to `ready`;
2. changes the target to `active` and assigns the single active slot;
3. sets `activated_at` only on first activation;
4. on first activation, makes the first upcoming stage `active` and its first
   upcoming task `available`;
5. preserves existing task/stage progress when reactivating a used roadmap;
6. is idempotent when the target is already active.

Returns `200` with the complete active roadmap resource.

## 19. Task details

### `GET /tasks/{task}`

The task must belong to the authenticated user through task -> stage -> roadmap
version -> roadmap. Missing and foreign IDs both return `404 task_not_found`.

```json
{
  "data": {
    "id": "01...",
    "type": "project",
    "title": "Build a Laravel API",
    "instructions": "Implement and test the endpoint.",
    "position": 2,
    "status": "available",
    "is_required": true,
    "estimated_minutes": 90,
    "completed_at": null,
    "can_complete": true,
    "depends_on_task_ids": ["01..."],
    "dependencies": [
      {
        "id": "01...",
        "title": "Read routing documentation",
        "status": "completed"
      }
    ],
    "resources": [
      {
        "id": "01...",
        "title": "Laravel Documentation",
        "url": "https://laravel.com/docs",
        "type": "documentation",
        "position": 1
      }
    ],
    "stage": {
      "id": "01...",
      "title": "API Foundations",
      "position": 1,
      "status": "active",
      "progress": {
        "completed_tasks": 1,
        "total_tasks": 3,
        "percentage": 33
      }
    },
    "roadmap": {
      "id": "01...",
      "goal": "Learn Laravel",
      "status": "active",
      "active": true,
      "progress": {
        "completed_tasks": 1,
        "total_tasks": 9,
        "percentage": 11
      }
    }
  },
  "meta": {"request_id": "01..."}
}
```

`can_complete=true` only when the roadmap is active and owns the active slot,
the task status is `available` or `current`, and every dependency is completed.
The roadmap-summary `active` flag uses the same roadmap status/slot rule.

## 20. Complete a task

### `POST /tasks/{task}/complete`

The endpoint accepts no client status, timestamps, user ID, roadmap ID, or
progress. `{}` or an empty body may be used. Missing and foreign IDs return `404
task_not_found`.

A task is eligible when it belongs to the roadmap's current version, its roadmap
is active and owns the active slot, its status is `available` or `current`, and
all prerequisites are completed. Otherwise the endpoint returns `409
task_completion_conflict` without mutation. Repeating a successful completion
is idempotent and preserves the original `completed_at`.

Completion locks and updates the execution tree transactionally. On first
completion it:

1. marks the task `completed` and sets `completed_at` once;
2. unlocks eligible upcoming tasks in active stages;
3. marks the stage completed after all required tasks are completed;
4. activates the next upcoming stage by position and unlocks its eligible tasks;
5. marks the roadmap completed and clears `active_slot` after every required
   task in the current version is completed.

Optional tasks do not contribute to progress and do not block stage/roadmap
completion. Returns `200` with the updated complete roadmap resource, not the
task-detail resource.

## 21. Lifecycle reference

```text
Generation: queued -> running -> validating -> succeeded
                         |             +-----> failed
                         +--------------------> cancelled (internal state only)

Roadmap: ready -> active -> completed
Stage:   upcoming -> active -> completed
Task:    upcoming -> available/current -> completed
```

The schema also recognizes `skip_pending`, `skipped`, and `replaced`, but there
is no public skip, replace, reopen, or reset endpoint.

## 22. Recommended frontend flow

```text
App starts
  ├─ No tokens/session → Login or Register
  └─ Session available → GET /me
       ├─ 200 → GET /me/onboarding-status
       └─ 401 → serialized refresh once → retry GET /me or sign out

Onboarding status
  ├─ completed=false
  │    ├─ GET/PATCH /me/preferences
  │    └─ GET then PUT /me/learning-profile
  │         └─ re-fetch /me/onboarding-status
  └─ completed=true
       └─ GET /me/active-roadmap
            ├─ 200 → render active roadmap/progress
            └─ 404 → enable Generate Roadmap

Generate Roadmap
  ├─ create one idempotency key for the click
  ├─ POST /roadmap-generation-requests
  ├─ poll GET /roadmap-generation-requests/{id}
  │    ├─ active → keep polling with backoff
  │    ├─ failed/cancelled → stop and show recovery
  │    └─ succeeded → GET /roadmaps/{roadmap_id}
  ├─ first roadmap may already be active
  └─ later ready roadmap → POST /roadmaps/{roadmap_id}/activate

Learn
  ├─ GET /me/active-roadmap
  ├─ render ordered stages/tasks and server progress
  ├─ GET /tasks/{task_id} for a detail page
  ├─ enable Complete only when can_complete=true
  ├─ POST /tasks/{task_id}/complete
  ├─ replace cached roadmap with the returned roadmap
  └─ continue until roadmap.status=completed
```

Suggested client state boundaries:

- Auth: user, access token, refresh state. Keep the refresh operation
  serialized.
- Onboarding: preferences, learning profile, derived completion status.
- Roadmap generation: request ID, status, failure code, roadmap ID.
- Roadmap: current loaded tree, active roadmap, and calculated progress.
- Task details: selected task and completion mutation state.

Do not duplicate server-derived onboarding logic in the frontend. Client-side
validation improves UX, but `GET /me/onboarding-status` remains authoritative.

## 23. Current API gaps the frontend must account for

These endpoints do not exist yet:

- List historical or ready roadmaps without already knowing an ID.
- Cancel an active generation request.
- Reopen/uncomplete, skip, replace, or manually mark a task current.
- Edit or regenerate an existing roadmap through a public endpoint.
- Password reset or email verification.
- Update account name/email/password.
- AI mentor chat.
- Evidence uploads, certificates, streaks, analytics, notifications,
  gamification, and admin APIs.

Consequences for the current frontend:

- Keep IDs for ready/historical roadmaps because only the active roadmap can be
  rediscovered without an ID.
- Keep unimplemented controls hidden or disabled.

## 24. CORS

For local development the backend must include the frontend origin, normally:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://ai-mentor-pi.vercel.app
```

The browser may send `Accept`, `Authorization`, `Content-Type`,
`Idempotency-Key`, and `X-Request-ID`. Credentials/cookies are disabled.
Only `X-Request-ID` is exposed to browser JavaScript. Origins are exact and
must not contain a trailing slash. Allowed methods are unrestricted, origin
patterns are empty, and preflight caching uses `max_age=0`.

## 25. Rate limits

| Endpoint | Key | Limit |
| --- | --- | --- |
| `POST /auth/register` | IP | 3/minute |
| `POST /auth/login` | normalized email + IP | 5/minute |
| `POST /auth/refresh` | IP | 10/minute |
| `POST /roadmap-generation-requests` | authenticated user ID, fallback IP | 3/minute |

Other implemented endpoints currently have no dedicated named application
throttle beyond deployment/platform protections.

## 26. Ownership and consistency invariants

- Identity comes only from the verified JWT, never client `user_id` input.
- Missing and foreign generation requests, roadmaps, and tasks are deliberately
  indistinguishable.
- Only one roadmap per user may own `active_slot=1`.
- Only one generation request per user may be active.
- Lifecycle states, timestamps, and progress are server-owned.
- Roadmap activation and task completion are transactional.
- Generation persistence is atomic across the roadmap tree and request success.
- Revocation verification fails closed when Redis is unavailable.
- Production absolute URLs use `APP_URL` plus trusted forwarded protocol and
  port. Forwarded host is intentionally not trusted.

## 27. Server integration configuration

These settings affect the public integration. Secrets must never be committed:

```env
APP_URL=https://masar-startup.onrender.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://ai-mentor-pi.vercel.app
JWT_SECRET=<base64-of-at-least-32-random-bytes>
JWT_ISSUER=ai-mentor-backend
JWT_AUDIENCE=ai-mentor-clients
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=30
JWT_CLOCK_SKEW_SECONDS=30
ROADMAP_GENERATOR=gemini
GEMINI_API_KEY=<secret>
GEMINI_MODEL=<available-model>
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_TIMEOUT_SECONDS=60
GEMINI_MAX_OUTPUT_TOKENS=8192
YOUTUBE_API_KEY=<secret>
YOUTUBE_BASE_URL=https://www.googleapis.com/youtube/v3
YOUTUBE_TIMEOUT_SECONDS=10
YOUTUBE_MAX_AGE_YEARS=5
QUEUE_CONNECTION=sync
```

`QUEUE_CONNECTION=sync` is suitable for the current Render free prototype. A
dedicated worker is recommended before production-scale AI traffic. The public
generation contract stays asynchronous in shape in either deployment mode.

## 28. Contract maintenance checklist

Any change to a route, request field, validation rule, response field, enum,
status transition, error code, auth rule, rate limit, CORS rule, or ownership
rule must update this file in the same PR. Before merging:

1. compare the endpoint matrix with `routes/api.php`;
2. compare inputs with every FormRequest;
3. compare examples with every JsonResource;
4. keep learning-profile source enums, snapshot schema, Gemini scope rules, and
   YouTube environment variables synchronized;
5. compare errors with `bootstrap/app.php`;
6. compare transitions with actions and enums;
7. run focused and full tests, Pint, PHPStan, Composer validation, route-list
   verification, and `git diff --check`.