# ADR-004: Roadmap Generation Request Concurrency

- Status: Accepted
- Date: 2026-08-25

## Context

Roadmap generation will eventually be asynchronous and expensive. A client may
retry after a timeout, two browser tabs may submit concurrently, and separate
application workers may serve those requests. The request contract must prevent
duplicate work without trusting process-local checks or exposing the client key.
It must also preserve the exact inputs used for an attempt even if onboarding
data changes later.

## Decision

Require an `Idempotency-Key` on creation and persist only its SHA-256 hash. The
database enforces `UNIQUE (user_id, idempotency_key_hash)`, so the same key may
be reused by different users but not create two attempts for one user.

Treat the existing enum values `queued`, `running`, and `validating` as active;
`succeeded`, `failed`, and `cancelled` are terminal. Active rows use
`active_slot = 1` and terminal rows use `NULL`. MySQL enforces
`UNIQUE (user_id, active_slot)` and checks that the slot is either `1` or
`NULL`. This nullable-slot pattern retains unlimited terminal history while
allowing at most one active request.

Creation runs in a transaction and locks the authenticated user's row. It checks
for an idempotent replay before checking onboarding or another active request.
This makes retry behavior stable even if the user's profile changes after the
original submission. The database unique keys remain the final defense across
processes.

Store an immutable, deterministic input snapshot with an explicit schema
version. Version 1 contains only the persisted learning profile and resource
language required to generate a roadmap. Replays never rebuild it.

Return `202` for newly queued requests and active replays. Return `200` for
terminal replays. A different key during an active request returns `409`.

## Consequences

- Retries are safe and never depend on a raw secret-like client key.
- Concurrent submissions cannot produce duplicate active requests even when
  application checks race.
- Historical input is auditable internally without exposing it publicly.
- Consumers must use a new key for a new attempt after a terminal request.
- Future processors must clear `active_slot` when entering a terminal state.
- The additive migration leaves legacy raw-key rows intact but new application
  writes never populate the legacy `idempotency_key` column.
