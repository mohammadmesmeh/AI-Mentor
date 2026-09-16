# AI Mentor — Development Rules & Engineering Governance

## Status

| Area | Status |
| --- | --- |
| Agent/engineering constitution (`AGENTS.md`, `.specify/memory/constitution.md`) | **Implemented** (documented policy) |
| Requirement-driven, spec-to-plan-to-tasks workflow | **Implemented** and exercised by all three features (001 home, 002 auth, 003 dashboard) |
| Validation gates (build/lint, backend composer gates) | **Implemented** |
| Formal test runner | **Not configured** — validation is build + lint + manual quickstart scenarios (docs/07) |

## Sources

- `AGENTS.md` / `AGENTS.md.backup` (project agent guidelines)
- `.specify/memory/constitution.md` (project Constitution, referenced)
- `AI Mentor — Extracted Product Requirements.md`
- `STRUCTURE.md`, `specs/*/plan.md` (constitution checks, architecture decisions)

## Source-of-truth hierarchy

For every task, reason from, in order: task prompt → Product Requirements → applicable Specify specs/plans/tasks → project context → design/architecture docs → existing code/patterns → applicable Skills → Constitution. No single source is interpreted in isolation. Requirements define behavior and scope; do not invent behavior, silently expand MVP scope, or implement explicitly out-of-scope functionality.

## Deliver the smallest maintainable vertical slice

- Prefer simple, maintainable solutions over broad rewrites, speculative architecture, or unnecessary abstraction.
- Reuse first: search existing components/hooks/services/types/APIs/patterns before creating new ones; extend/refactor rather than duplicate.
- Do the impact analysis (routes, features, entities, contracts, state, deps, DB, async jobs, observability, ownership, concurrency, idempotency) before implementing; touch only what the task requires.
- Components and hooks stay focused (no God components/hooks); presentational vs data-access separation; no circular cross-layer imports.
- No new dependency when the existing stack solves the problem; no libraries for trivial functionality.

## Spec-driven workflow

```text
Requirement → Specification → Plan → Tasks → Implementation → Validation → Review
```

- Read the relevant spec before implementing; respect the plan and tasks; keep implementation consistent with the approved spec.
- Generated artifacts never override the Constitution, security rules, or product requirements.
- When docs and code diverge, determine intent before changing either; significant refactors require explicit approval (explain why, what changes, affected areas, benefit, risks, and any smaller alternative — do not hide refactoring inside a feature).

## Security & data ownership (non-negotiable)

- Backend enforces authorization; **the UI is never a security boundary**. Hiding an action in the frontend is not authorization.
- Never trust client-supplied ownership IDs/fields without server-side verification; ownership derives from the authenticated user.
- One user's roadmaps, tasks, progress, chat, resources, and account data must never be exposed to another user.
- Never log or expose tokens, session secrets, API keys, passwords, credentials, or unnecessary private data.
- Never put tokens in URLs; never persist refresh tokens in `localStorage` (see token rules in docs/05).
- Minimal sensitive data to external services; no unnecessary outbound requests.

## Data integrity

- The persisted roadmap is the source of truth — never regenerated per request, never silently replaced. Significant changes follow the defined lifecycle (adaptation proposal + approval, or reset-and-rebuild).
- State changes need validation, authorization, idempotency where required, concurrency awareness, transactional integrity where appropriate, and safe failure. Never partially apply a state mutation when it can be avoided.
- Assume multiple devices/sessions/retries/background jobs; protect generate/regenerate/reset/complete/accepted-reject with idempotency and concurrency controls. The frontend is never assumed to prevent duplicate requests.

## AI rules

- **AI output is untrusted input.** Pipeline: AI output → schema validation → semantic validation → business rules → persistence/application. AI cannot bypass authorization, business rules, ownership checks, validation, or persistence constraints.
- Provider replaceability: never scatter provider SDK calls through business logic; keep provider-specific behavior behind the project's AI abstraction (Gemini and Grok are baseline providers).
- Context/privacy: send only the minimum required context (goal, current stage/task, progress, preferences); never send tokens, passwords, keys, unrelated private data, PII, or secrets.
- AI actions that change roadmap/user state require the validate → propose → user-approve → apply lifecycle; model output may not directly execute privileged/destructive operations.
- Reliability: handle provider failure, timeouts, rate limits, invalid responses/JSON, schema/semantic/business-rule failures, and bounded retries. Do not retry unsafe state changes without idempotency. Fail safely; never corrupt or silently replace valid persisted state on AI failure.
- Observability (where implemented): provider, model, prompt/schema version, request ID, execution time, token usage, validation result, status, failure category — never secrets or unnecessary user data.

## Async jobs

- Heavy/long operations (AI roadmap generation, regeneration, resource discovery/validation) use the project's job infrastructure with lifecycle `QUEUED → PROCESSING → COMPLETED` and failure paths `FAILED / RETRYING / CANCELLED`.
- The frontend represents meaningful job states rather than pretending a synchronous result (see the roadmap-generation poll contract in docs/05).

## Internationalization & accessibility

- Arabic + English; RTL first-class; locale-aware formatting; no hardcoded user-facing strings (use `messages/en.json` + `ar.json`); UI language is independent from resource language.
- Keyboard accessibility, semantic HTML, accessible labels/states, visible focus; verify both RTL and LTR when layouts change.

## Error handling

- Handle errors deliberately per layer: API, UI, async jobs, AI, resource discovery. No swallowed errors, hidden failures, misleading success responses, partial state without a recovery path, or unnecessary internal details in errors. Keep actionable logs without leaking sensitive data.

## Testing & validation

- Testing is proportional to risk. Strong validation for business-critical, security-sensitive, ownership/authorization, state-changing, concurrency/idempotency, AI, bug-fix, API-contract, and DB-mutation changes.
- Order: targeted tests → related integration → typecheck → lint → relevant E2E → build (adjusted per change).
- Before declaring completion: review the final diff; confirm only intended files changed; no debug code/temp files/secrets; no duplicated logic; no unnecessary deps; no scope expansion; tests/checks actually ran. Use explicit statuses (PASS / FAIL / NOT RUN / BLOCKED) and never claim a check passed unless it ran and passed.

## Git policy

- Work on a purpose-specific branch; don't discard user changes; deliberate commit/push/merge/PR only when the user asks — never merge to `main` without an explicit request; no unrelated branch cleanup.

## Conventions to follow in this codebase

- Feature-based folders (`src/features/<feature>/{components,pages,...}`), `shared/` for reusable code, `src/components/ui/` for shadcn primitives, `src/redux/slices/` for slices (the actual repo layout — lighter than the STRUCTURE.md ideal; follow what's real, keep compatible with STRUCTURE.md placement rules).
- Server Components by default; client only where interactivity/state requires it; `DashboardPage` is the dashboard's single client data boundary (pattern documented in docs/01 and docs/03).
- All user-facing strings localized; logical properties for RTL; `useT(namespace)` for translations.
- Backend work follows `Backend/README.md` — built in parallel by another developer, not owned by the frontend workstream: modular monolith layering (Presentation → Application → Domain → Infrastructure), ULID ids, UTC timestamps, JWT bearer auth (current implementation; final auth architecture pending reconciliation — see docs/04/05), `/api/v1`, `data|error`+`meta.request_id` envelope, and the backend quality gates (composer validate/audit, artisan test, Pint, PHPStan, route:list).

## What this doc does not do

It states rules that already exist in the repository (AGENTS.md/Constitution). It does not add new policy. Where this summary conflicts with the authoritative `AGENTS.md` or Constitution text, those documents win.