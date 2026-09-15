---

name: api-integration
description: Integrate the Next.js frontend with the existing backend API using Axios and the official API contract. Use when the backend is already implemented and the frontend needs real API integration, authentication integration, API client setup, loading/error states, or API validation. Never modify backend contracts or invent endpoints.
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# API Integration

## Purpose

Integrate the existing AI Mentor Next.js frontend with the already-implemented Backend API.

The Backend is owned and maintained separately by the Backend team.

The Backend API already exists.

The frontend must consume the existing API contract rather than redesigning or inventing it.

Primary source of truth:

`API_CONTRACT.md`

## Scope

This skill is responsible only for:

* Frontend API integration
* Axios setup
* API client configuration
* Authentication API integration
* Feature API integration
* Request/response mapping
* Loading states
* Error states
* Unauthorized handling
* API-related environment configuration
* API integration validation

This skill MUST NOT:

* Modify Backend code
* Change Backend endpoints
* Invent API endpoints
* Invent request/response schemas
* Redesign the Backend architecture
* Deploy the Backend
* Perform Git workflow unless explicitly requested
* Add unrelated frontend features
* Redesign UI unrelated to API integration

---

# Core Principles

## 1. Contract First

Before writing API code:

1. Read `API_CONTRACT.md`.
2. Inspect the existing frontend API architecture.
3. Identify existing API calls.
4. Identify existing mock/not-connected boundaries.
5. Compare frontend expectations with the official API contract.

Never guess an endpoint.

Never guess a response shape.

Never guess authentication behavior.

If the contract is incomplete or contradictory, stop the affected integration and report the issue.

---

# 2. Axios

Use Axios as the HTTP client.

First check whether Axios already exists in `package.json`.

If Axios exists:

* Reuse the installed version.
* Follow the existing dependency conventions.

If Axios does not exist:

* Add Axios as the only dependency required for HTTP communication.
* Do not add another HTTP client.

Do not use:

* fetch
* ky
* superagent
* got
* another HTTP client

for new API integration.

Existing unrelated HTTP code should not be rewritten unless necessary for the requested integration.

---

# 3. Axios Client

Prefer one centralized Axios instance for the application.

Before creating one:

* Search for an existing HTTP client.
* Search for existing API utilities.
* Search for existing auth interceptors.
* Search for existing request/response handling.

Reuse existing architecture when appropriate.

Do not create:

```text
axios instance per feature
```

unless the existing architecture explicitly requires it.

The centralized client should contain only behavior that is actually required.

Typical responsibilities may include:

* base URL
* JSON headers
* authentication handling
* response normalization
* centralized error handling

Do not add interceptors simply because Axios supports them.

Every interceptor must have a concrete reason.

---

# 4. Environment Configuration

Never hardcode production API URLs in source code.

Use the project's existing environment configuration convention.

Before creating a new variable:

1. Search the repository for existing API URL variables.
2. Check `.env.example`.
3. Check Next.js configuration.
4. Check existing documentation.

Reuse an existing variable when appropriate.

If a new variable is genuinely required, use a clear name consistent with the project.

Example only:

```text
NEXT_PUBLIC_API_BASE_URL
```

Do NOT automatically create this variable if the project already has another convention.

Never commit:

* `.env`
* `.env.local`
* production secrets
* API keys
* private credentials
* tokens

Only update `.env.example` with placeholder values when appropriate.

---

# 5. Server vs Client

Respect the existing Next.js App Router architecture.

Prefer Server Components where possible.

Do not convert a Server Component into a Client Component merely to make API calls easier.

Before using Axios in a Client Component, determine whether the request actually requires client-side execution.

Minimize client-side JavaScript.

Avoid duplicate API requests caused by:

* Server + Client fetching the same resource
* unnecessary effects
* repeated renders
* duplicate Redux dispatches
* duplicate initialization

---

# 6. Authentication

Read the authentication section of `API_CONTRACT.md` before implementing auth.

Determine the actual mechanism:

* cookie/session
* bearer token
* refresh token
* another documented mechanism

Do not assume token storage.

If the API uses HttpOnly cookies:

* Do not read the cookie from JavaScript.
* Do not copy it into localStorage.
* Do not expose it to client components.

If the API explicitly uses Authorization headers:

* Implement them according to the documented contract.
* Do not hardcode tokens.

Integrate:

* login
* logout
* session handling
* unauthorized responses
* protected routes

only where the API contract supports them.

Preserve existing auth architecture unless the integration requires a narrow change.

---

# 7. API Types

Use existing TypeScript types when available.

Do not duplicate types unnecessarily.

If API response types are documented or already implemented, reuse them.

If the contract provides a response shape but the frontend has no type:

create the minimum necessary type in the location consistent with the existing architecture.

Never invent fields.

For example, do not assume:

```ts
interface User {
  id: string;
  name: string;
  email: string;
}
```

unless these fields are actually supported by the API contract.

---

# 8. API Functions

Keep API functions small and explicit.

Prefer:

```text
API client
    ↓
feature API function
    ↓
feature/page
```

Avoid putting raw Axios requests throughout UI components.

Do not create an unnecessary abstraction layer.

Do not introduce:

* repositories
* service factories
* generic API frameworks
* dependency injection
* large data-access abstractions

unless the existing project architecture already uses them.

---

# 9. Mock / Not Connected Boundaries

Search for:

* `mock`
* `not-connected`
* placeholder API implementations
* fake data
* temporary auth
* TODO API integrations

Replace them only when the real endpoint exists in `API_CONTRACT.md`.

Do not remove working fallback behavior blindly.

If a mock represents functionality that has no backend endpoint yet:

leave it unchanged and report it.

Never fabricate API data to make the UI appear connected.

---

# 10. Loading States

Use the existing project loading patterns.

Where API calls are asynchronous, provide appropriate loading behavior.

Do not introduce a new loading system if one already exists.

Avoid unnecessary spinners.

Prefer the existing:

* loading.tsx
* skeleton
* loading state
* Suspense
* existing UI primitives

where appropriate.

---

# 11. Error Handling

Handle Axios errors safely.

Differentiate when supported by the API:

* network failure
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found
* validation errors
* server errors

Do not expose internal Backend details to users.

Never display:

* stack traces
* database errors
* internal server paths
* tokens
* credentials
* sensitive response data

Use existing localization architecture for user-facing messages.

Add English and Arabic messages when new user-facing API states are introduced.

---

# 12. Security

During integration, proactively check:

## Secrets

Ensure no:

* API key
* secret
* password
* private token

is exposed in client-side code.

## URLs

Do not construct API URLs from unsafe user input.

Do not allow arbitrary user-controlled URLs to become API destinations.

## Authentication

Check:

* unauthorized handling
* token exposure
* cookie handling
* logout behavior
* protected routes

## Data

Do not expose backend-only fields to the UI unnecessarily.

Do not log sensitive API responses.

Remove debug logging introduced during integration.

---

# 13. Feature Integration

Integrate features according to the project's existing specifications.

Before integrating a feature:

1. Read its feature specification.
2. Check `API_CONTRACT.md`.
3. Identify the exact endpoint.
4. Identify request shape.
5. Identify response shape.
6. Identify authentication requirements.
7. Identify loading/error states.
8. Implement the smallest required change.

For AI Mentor, prefer existing feature boundaries such as:

```text
Auth
Onboarding
Dashboard
Learning
```

Do not assume an endpoint exists simply because a frontend screen exists.

---

# 14. Dashboard Integration

For Dashboard specifically:

* Do not fabricate learning progress.
* Do not fabricate lessons.
* Do not fabricate AI insights.
* Do not fabricate recommendations.
* Do not fabricate activity history.
* Do not fabricate metrics.

Only render real API data when the corresponding API endpoint and response are available.

If an endpoint is unavailable:

preserve the honest unavailable/empty state.

Do not make the dashboard appear connected using fake data.

---

# 15. i18n

Preserve:

* Arabic
* English
* RTL
* LTR

All new user-facing API messages must use `next-intl` / the project's existing translation architecture.

Do not hardcode user-facing English strings inside API handling code if the project already uses localization.

---

# 16. Least Modification

Modify only what is required.

Before creating a new file:

* Search for an existing suitable file.

Before creating a new abstraction:

* Search for an existing abstraction.

Before modifying a shared component:

* Confirm the change is necessary for API integration.

Do not refactor unrelated code.

Do not fix unrelated technical debt.

Report unrelated issues under:

`Engineering Notes / Warnings`

---

# 17. Validation

After implementation, run the project's existing validation commands.

At minimum, where available:

```text
TypeScript / typecheck
ESLint
production build
```

Validate API integration for:

* successful request
* authentication
* unauthorized behavior
* error behavior
* loading behavior
* empty state

Validate both locales:

```text
/en
/ar
```

Validate:

* RTL
* LTR

If browser tooling is available, test the real API flow in the browser.

If browser tooling is unavailable:

report:

`BLOCKED — browser validation unavailable`

Never claim browser validation passed without actually testing it.

---

# 18. Git Safety

Git operations are outside the default scope of this skill.

Do not:

* create branches
* commit
* push
* create PRs
* merge

unless the user explicitly requests Git operations.

Before any explicitly requested Git operation:

* inspect current branch
* inspect status
* inspect diff
* ensure only API integration changes are included
* ensure secrets are not staged

---

# 19. Execution Workflow

Follow this exact order:

```text
1. Read API_CONTRACT.md
        ↓
2. Audit existing frontend API architecture
        ↓
3. Check Axios availability
        ↓
4. Identify environment configuration
        ↓
5. Identify authentication mechanism
        ↓
6. Create/reuse centralized Axios client
        ↓
7. Integrate authentication
        ↓
8. Integrate available feature APIs
        ↓
9. Replace only confirmed mock/not-connected boundaries
        ↓
10. Add loading/error/empty handling
        ↓
11. Run validation
        ↓
12. Security review
        ↓
13. Report results
```

Do not skip the contract verification step.

---

# 20. Final Report

The final response must contain:

## Solution

Short summary of what was integrated.

## API Integration

List the actual endpoints integrated.

## Axios

* Existing or newly installed
* Axios client location
* Interceptors, if any
* Reason for each interceptor

## Authentication

State:

```text
PASS
PARTIAL
BLOCKED
NOT IMPLEMENTED
```

and explain why.

## Files

List:

* created files
* modified files

Do not list unrelated files.

## Environment

Report:

* API environment variable name
* whether `.env.example` was updated

Never output actual secret values.

## Validation

Use only:

```text
PASS
FAIL
BLOCKED
NOT RUN
```

for:

* TypeScript
* ESLint
* Build
* API integration
* Authentication
* Browser validation

## Security

Report relevant findings.

## Warnings

Report unresolved:

* API contract mismatches
* missing endpoints
* missing environment configuration
* backend dependencies
* browser validation limitations

---

# Final Rules

1. Backend is external to this skill.
2. `API_CONTRACT.md` is the API source of truth.
3. Axios is the required HTTP client.
4. Never invent an endpoint.
5. Never invent a response shape.
6. Never expose secrets.
7. Never hardcode production URLs.
8. Never fabricate API data.
9. Preserve the existing architecture.
10. Prefer Server Components.
11. Minimize Client Components.
12. Use next-intl for user-facing messages.
13. Preserve Arabic/English and RTL/LTR.
14. Use Least Modification.
15. Do not perform Git operations unless explicitly requested.

**Golden Rule:**

API Contract → Axios → Real API → Minimal Frontend Changes → Validation

**Advise broadly. Modify narrowly.**
