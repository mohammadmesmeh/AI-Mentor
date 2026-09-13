# ADR-005: API-first JWT Bearer Authentication

- Status: Accepted
- Date: 2026-08-27

## Context

The backend previously used Laravel Sanctum's stateful SPA mode, browser
sessions, cookies, and a CSRF bootstrap endpoint. That model couples every
client to browser-cookie behavior and does not provide one explicit token
contract for web, mobile, and future API consumers. A failed registration also
demonstrated that persisting identity before later session work could leave a
partially created account.

The system needs short-lived credentials, server-controlled session revocation,
safe refresh rotation, consistent ownership through Laravel authentication, and
no personally identifying data embedded in portable credentials.

## Decision

Use API-first bearer authentication through a custom Laravel `auth:jwt` guard.
Use maintained `lcobucci/jwt` 5.6 to issue and validate JWTs rather than
implementing parsing or cryptography. Access tokens use HS256 with a dedicated,
runtime-injected secret containing at least 256 bits. HS256 fits the current
single modular-monolith trust boundary; asymmetric signing would add key
distribution complexity without a separate verifier.

Access tokens default to 15 minutes and contain only `iss`, `aud`, `sub`, `jti`,
`sid`, `iat`, `nbf`, and `exp`. Validation fixes the accepted algorithm in
server configuration, verifies signature and registered claims before reading
identity claims, checks ULID identifiers, loads the user, and requires an active
account and active session family.

Generate refresh tokens from 48 cryptographically secure random bytes and
transport them as unpadded URL-safe Base64. Persist only a SHA-256 hash in
MySQL. Each login creates a distinct family. Refresh runs in a transaction,
locks the presented row, revokes it, creates a replacement in the same family,
and records `replaced_by_id`. Reuse of a replaced token revokes the entire
family.

MySQL is the durable session-family source of truth. Redis contains namespaced
`jti` and `sid` denylist markers only, each with a bounded TTL. Logout revokes
the current family in MySQL and writes both markers for immediate rejection.
Authentication fails closed when Redis is unavailable because accepting an
unverified token could restore a revoked session.

Register, login, and refresh return one non-cacheable token-pair contract.
Logout requires both the access token and the current opaque refresh token and
returns `204`. All identity creation and initial token issuance occur in one
database transaction.

## Alternatives considered

- Keep Sanctum stateful SPA sessions: strong for a browser-only same-site SPA,
  but retains cookies, CSRF coordination, and a separate integration model for
  mobile/API clients.
- Sanctum personal access tokens: do not provide the required short access plus
  rotating opaque refresh-token lifecycle.
- OAuth2/Passport: valuable for third-party authorization, but materially
  broader than first-party authentication requirements.
- Asymmetric JWT signing: deferred until independent services need public-key
  verification across trust boundaries.
- Self-contained JWTs without server revocation: rejected because logout and
  compromised-session response would remain delayed until token expiry.

## Security tradeoffs

JWT access tokens reduce per-request session lookups but become bearer secrets
until expiry. Short lifetime, MySQL family checks, and Redis denylisting bound
that risk at the cost of a database and Redis read on authenticated requests.
The latter is intentional for immediate revocation and account-status changes.

Refresh rotation limits replay, while reuse detection can revoke a legitimate
concurrent request's newly issued family after a race. Clients therefore must
serialize refresh operations and atomically replace their stored token. Redis
availability is part of authentication availability because fail-closed is the
safer default.

Browser applications remain responsible for XSS-resistant token handling.
Removing authentication cookies removes the CSRF flow but does not make Local
Storage safe; refresh tokens must not be stored there. Tokens and secrets must
never enter logs, URLs, Git history, or container images.

## Consequences

- Web and mobile clients use the same Authorization header and token contract.
- Clients must rotate stored refresh tokens, serialize refresh requests, and
  reauthenticate after family revocation.
- Existing Sanctum/browser sessions stop working at migration and users sign in
  again.
- CORS no longer supports credentials and explicitly permits bearer headers.
- Sanctum's dependency, configuration, stateful middleware, and CSRF endpoint
  are removed. The historical personal-access-token migration remains to avoid
  destructive data loss, but is legacy and unused.
- Key rotation and multi-device session management UI are deferred. A future
  asymmetric migration remains possible behind the access-token boundary.
