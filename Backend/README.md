# AI Mentor Backend

Laravel 12 foundation for the AI Mentor platform. This phase establishes the
identity, learning-profile, roadmap, roadmap-version, stage, task, dependency,
and roadmap-generation-request persistence model. AI generation, mentor chat,
progress, resources, and adaptation workflows are intentionally deferred.

## Architecture

The backend is a modular monolith. A single deployment and database keep the
initial operational model simple, while module boundaries keep domain changes
local and leave room for later extraction only when evidence justifies it.

```text
app/
├── Modules/
│   ├── Identity/
│   │   ├── Domain/Enums
│   │   ├── Application/Actions
│   │   ├── Infrastructure/Persistence/Models
│   │   └── Presentation/Http/{Controllers,Requests,Resources}
│   ├── LearningProfile/
│   │   ├── Domain/Enums
│   │   └── Infrastructure/Persistence/Models
│   ├── Roadmap/
│   │   ├── Domain/{Enums,ActiveRoadmapSlot.php}
│   │   ├── Application/Actions
│   │   └── Infrastructure/Persistence/Models
│   └── TaskExecution/
│       ├── Domain/Enums
│       ├── Application/Actions
│       └── Infrastructure/Persistence/Models
└── Shared/
    └── Presentation/Http/{Controllers,Middleware,Resources}
```

Only directories with real responsibilities are present. Presentation calls
Application, Application coordinates Domain rules, and Infrastructure provides
Laravel/Eloquent implementations. Domain code does not depend on HTTP.

### Module boundaries

- **Identity** owns users, authentication identity, and user preferences.
- **LearningProfile** owns persisted onboarding inputs used to personalize a plan.
- **Roadmap** owns roadmap lifecycle, immutable versions, and ordered stages.
- **TaskExecution** owns task taxonomy, task state, replacements, and dependencies.
- **Shared** contains the API transport concerns genuinely shared across modules.

## Data model

```mermaid
erDiagram
    USERS ||--o| USER_PREFERENCES : has
    USERS ||--o| LEARNING_PROFILES : has
    USERS ||--o{ ROADMAPS : owns
    USERS ||--o{ ROADMAP_GENERATION_REQUESTS : submits
    ROADMAPS o|--o{ ROADMAP_GENERATION_REQUESTS : receives
    ROADMAPS ||--o{ ROADMAP_VERSIONS : versions
    ROADMAPS o|--o| ROADMAP_VERSIONS : current_version
    ROADMAP_GENERATION_REQUESTS o|--o{ ROADMAP_VERSIONS : produces
    ROADMAP_VERSIONS ||--o{ STAGES : contains
    STAGES ||--o{ TASKS : contains
    TASK_TYPES ||--o{ TASKS : classifies
    TASKS ||--o{ TASK_DEPENDENCIES : task
    TASKS ||--o{ TASK_DEPENDENCIES : prerequisite
    TASKS o|--o| TASKS : replaced_by
```

All public entity identifiers and foreign keys are ULIDs. Timestamps are stored
in UTC. MySQL is the source of truth; Redis backs cache, sessions, queues, and
Horizon.

The database permits many historical roadmaps per user but enforces at most one
current roadmap with `UNIQUE (user_id, active_slot)`. The current record uses
`active_slot = 1`; inactive records use `NULL`. The `ActivateRoadmap` action is
the single application-level mutation path for this rule.

## API

All endpoints are versioned under `/api/v1`.

```http
GET /api/v1/health
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET /api/v1/me
GET /sanctum/csrf-cookie
```

Responses use `data` or `error` plus `meta.request_id`. The same ULID request ID
is returned in `X-Request-ID`. Production API errors do not expose stack traces
or database details.

### SPA authentication

Authentication uses Sanctum's stateful browser flow and the `web` session
guard. It never creates personal access tokens and never returns bearer tokens.
Registration also creates the user's default preferences (`en`, `both`, `UTC`)
in the same database transaction. Login is limited to active accounts and uses
one generic validation error for unknown credentials, wrong passwords,
suspended users, and deletion-requested users.

The browser must send credentials on every request. Before registration, login,
or logout, request `GET /sanctum/csrf-cookie`, then send the URL-decoded
`XSRF-TOKEN` cookie as the `X-XSRF-TOKEN` header. Successful registration and
login rotate the session identifier. Logout invalidates the session and rotates
its CSRF token. Login is limited to five attempts per minute for each normalized
email and IP pair; registration is limited to three attempts per minute per IP.

Set `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, and
`CORS_ALLOWED_ORIGINS` explicitly for each environment. CORS allows credentials
and never uses a wildcard origin. Session cookies are HTTP-only. The local
examples use `SameSite=Lax`, which is appropriate when the frontend and API are
same-site (different ports are allowed). For a truly cross-site production SPA,
use `SESSION_SAME_SITE=none`, `SESSION_SECURE_COOKIE=true`, and HTTPS; otherwise
keep `Lax`. Production must always set `SESSION_SECURE_COOKIE=true`.

## Docker development environment

Docker is the supported local runtime. It provides PHP 8.4 with NGINX and FPM in
one unprivileged application image, MySQL 8.4, Redis 7.4, Horizon, and the
Laravel scheduler. Only the application is published to the host at
`http://localhost:8000`; MySQL and Redis remain on the private Docker network.
Base image tags are also locked to reviewed digests for reproducible builds;
dependency upgrades should update the tag and digest together.

| Service | Lifecycle | Responsibility |
| --- | --- | --- |
| `setup` | one-shot | Installs locked Composer dependencies into `vendor_data`. |
| `migrate` | one-shot | Runs pending migrations and the idempotent seeders. |
| `app` | long-running | Serves the API through the image's NGINX and PHP-FPM. |
| `horizon` | long-running | Processes Redis-backed queues. |
| `scheduler` | long-running | Runs Laravel's scheduler worker. |
| `mysql` | long-running | Persists application data in `mysql_data`. |
| `redis` | long-running | Persists queue/cache data in `redis_data`. |

From `Backend/`, create the local environment file and replace every placeholder
password. Initialize the dependency volume, generate an application key, and
copy the printed value into `APP_KEY` in `.env.docker` before starting the stack.

```bash
cp .env.docker.example .env.docker
docker compose run --rm --no-deps setup
docker compose run --rm --no-deps setup php artisan key:generate --show
docker compose up -d
docker compose ps
curl --fail http://localhost:8000/api/v1/health
```

`docker compose up -d` is safe to repeat. Compose waits for MySQL and Redis,
installs dependencies, then migrates and seeds before starting the three runtime
services. Source is bind-mounted for development while the named vendor volume
prevents the host mount from hiding container-installed dependencies. Shared
named volumes also keep `storage` and `bootstrap/cache` writable by the
unprivileged application user across all Laravel processes.

```bash
docker compose logs -f app horizon scheduler
docker compose exec app php artisan migrate:status
docker compose exec app php artisan horizon:status
docker compose exec app php artisan schedule:list
docker compose down
```

`docker compose down` preserves named volumes. Use `docker compose down -v` only
when intentionally deleting the local database, Redis data, and dependencies.
The Horizon dashboard remains denied outside the local environment until an
administrative authorization model is added.

## Quality gates

```bash
docker compose exec app composer validate --strict
docker compose exec app php artisan migrate:status
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse
docker compose exec app php artisan route:list --path=api/v1
```

The suite can use SQLite for fast host-side feedback, while the documented
container command retains the Compose MySQL connection and exercises MySQL-only
constraints. The self-dependency `CHECK` is added by the migration; the Domain
rule protects every supported database.

## Production image

The `production` target installs dependencies from `composer.lock` without dev
packages, generates an authoritative autoloader, and runs as `www-data`. Runtime
secrets are injected by the deployment platform; `.env` files, Git metadata,
tests, local documentation, logs, and development tool configuration are
excluded from the build context. Database migrations never run during image
build.

```bash
docker build --target production -t ai-mentor-backend:production .
```

Run migrations as a separate release job before starting the production app,
Horizon, and scheduler processes. TLS should terminate at the deployment
platform or a trusted reverse proxy; the container listens on unprivileged port
`8080`.

## Architecture decisions

- [ADR-001: Modular Monolith](docs/architecture/ADR-001-modular-monolith.md)
- [ADR-002: ULID Identifiers](docs/architecture/ADR-002-ulid-identifiers.md)
- [ADR-003: Single Active Roadmap](docs/architecture/ADR-003-single-active-roadmap.md)

## Deferred to the next phase

Email verification and password reset, roadmap generation and provider
adapters, chat, resource discovery, task completion/progress, adaptation
proposals, ownership-scoped product endpoints, observability, deployment, and
the admin surface are outside this phase.
