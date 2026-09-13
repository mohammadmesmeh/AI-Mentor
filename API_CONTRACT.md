# AI Mentor Backend API Contract

This is the frontend integration contract for the API currently implemented in
`Backend/`. It documents current behavior only; planned endpoints are listed as
gaps at the end.

## 1. Connection

| Environment | Base URL |
| --- | --- |
| Local | `http://localhost:8000/api/v1` |
| Production | Not assigned yet |

Recommended frontend variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

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

Every response includes:

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
| `POST` | `/roadmap-generation-requests` | Bearer + idempotency | `202` or replay `200` |
| `GET` | `/roadmap-generation-requests/{id}` | Bearer | `200` |
| `GET` | `/roadmaps/{id}` | Bearer | `200` |

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
preferences: `ui_locale=en`, `resource_language=both`, `timezone=UTC`.

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
    "timezone": "Asia/Hebron",
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
  "resource_language": "ar",
  "timezone": "Asia/Hebron"
}
```

Allowed values:

- `ui_locale`: `ar` or `en`.
- `resource_language`: `ar`, `en`, or `both`.
- `timezone`: valid IANA timezone, maximum 64 characters.

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
    "created_at": "2026-09-10T09:43:04.000000Z",
    "updated_at": "2026-09-10T09:43:04.000000Z"
  },
  "meta": {
    "request_id": "01..."
  }
}
```

Legacy incomplete records can return `desired_outcome` or
`preferred_learning_methods` as `null`.

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

- All five fields are required.
- `goal`: maximum 1,000 characters.
- `desired_outcome`: maximum 2,000 characters.
- `available_minutes_per_week`: integer from 15 to 10,080.
- `self_assessed_level`: `complete_beginner`, `some_experience`, or
  `intermediate`.
- `preferred_learning_methods`: 1-4 unique values from
  `hands_on_projects`, `reading_docs`, `video_walkthroughs`, `quizzes_drills`.
- Extra fields are rejected.

Returns `201` when created and `200` on later replacements. Both return the
learning-profile response.

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

The currently implemented local generator usually completes quickly, but the
frontend must preserve the asynchronous contract for a future AI provider.

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

## 17. Recommended frontend flow

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
       └─ enable Generate Roadmap

Generate Roadmap
  ├─ create one idempotency key for the click
  ├─ POST /roadmap-generation-requests
  ├─ poll GET /roadmap-generation-requests/{id}
  │    ├─ active → keep polling with backoff
  │    ├─ failed/cancelled → stop and show recovery
  │    └─ succeeded → GET /roadmaps/{roadmap_id}
  └─ render stages → tasks → dependencies/resources
```

Suggested client state boundaries:

- Auth: user, access token, refresh state. Keep the refresh operation
  serialized.
- Onboarding: preferences, learning profile, derived completion status.
- Roadmap generation: request ID, status, failure code, roadmap ID.
- Roadmap: current loaded roadmap tree.

Do not duplicate server-derived onboarding logic in the frontend. Client-side
validation improves UX, but `GET /me/onboarding-status` remains authoritative.

## 18. Current API gaps the frontend must account for

These endpoints do not exist yet:

- Get/list the user's current or historical roadmaps without already knowing an
  ID.
- Mark tasks complete, skip tasks, or track progress.
- Activate a later `ready` roadmap.
- Cancel an active generation request.
- Password reset or email verification.
- Update account name/email/password.
- AI mentor chat or real external AI generation.

Consequences for the current frontend:

- Keep the returned generation request ID and roadmap ID in app state while the
  flow is active.
- A page reload cannot reliably rediscover an existing roadmap using the
  current API alone.
- Render roadmap content read-only; task action controls must stay disabled or
  hidden until their backend endpoints exist.

## 19. CORS

For local development the backend must include the frontend origin, normally:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

The browser may send `Accept`, `Authorization`, `Content-Type`,
`Idempotency-Key`, and `X-Request-ID`. Credentials/cookies are disabled.
Currently only `X-Request-ID` is exposed to browser JavaScript.
