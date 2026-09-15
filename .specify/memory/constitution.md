# AI Mentor Constitution

## Core Principles

### I. Security, Privacy, and Data Ownership

User data must remain isolated, protected, and accessible only to authorized users and roles.

- Authorization and ownership enforcement are server-side responsibilities.
- UI visibility or restrictions must never be treated as a security boundary.
- Data shared with external services must be limited to what is necessary.
- Authentication data, session information, tokens, and unnecessary personal data must not be exposed to external services.
- Every operation accessing protected user data must enforce appropriate authorization and ownership boundaries.
- Sensitive operations must not bypass established security boundaries.

### II. Separation of Responsibilities and Architectural Boundaries

The system must maintain clear boundaries between UI, application behavior, business rules, data access, and infrastructure concerns.

- Frontend and Backend must maintain distinct responsibilities and communicate through the defined API boundary.
- Business rules and security-critical decisions must not depend solely on frontend behavior.
- Each architectural layer must own responsibilities appropriate to that layer.
- New functionality must follow established architectural boundaries.
- Business logic must not be unnecessarily duplicated across layers.
- Unrelated responsibilities must not be unnecessarily combined in the same module, component, or service.

### III. Data Integrity and Authoritative Application State

Durable application state must remain valid, consistent, and authoritative.

- Persisted application state is the source of truth for durable state.
- Data originating from AI or external sources must be treated as untrusted input until appropriately validated.
- State transitions must follow defined business rules.
- Mutations must preserve data integrity and consistency.
- Generated or externally sourced data must be validated before persistence.
- Temporary representations such as cache, queue state, or client state must not silently become authoritative application state.

### IV. Responsible and Controlled AI Behavior

AI is an assistive system, not an unrestricted authority over application state, security, or trust decisions.

- AI-generated output must be treated as untrusted input.
- AI must not silently modify durable application state.
- Significant AI-driven changes must require explicit user approval where required by product rules.
- AI must receive only the minimum context necessary to perform the requested task.
- AI must not be treated as the sole authority for security, authorization, trust, or external-resource validation decisions.
- A clear distinction must be maintained between AI suggestions, validated application state, and user-approved changes.

### V. Appropriate Abstraction and Provider Replaceability

External AI providers must be integrated through appropriate boundaries that prevent unnecessary coupling with core application logic.

- Core business logic must not depend directly on provider-specific APIs or implementation details.
- AI provider integrations must remain replaceable where required by the project.
- Provider-specific concerns must be isolated from core business logic.
- Abstractions must be proportional to actual requirements and must not be introduced solely for theoretical future needs.
- Adding or replacing an AI provider should not require unnecessary changes throughout the application.

### VI. Reliability, Failure Handling, and Operational Resilience

The system must handle expected failures explicitly and remain predictable when external services or long-running operations fail.

- External services may fail, timeout, rate-limit, or return invalid responses.
- Long-running or resource-intensive operations must not unnecessarily block user-facing requests.
- Operations with meaningful lifecycle states must expose those states appropriately.
- Failures must result in explicit and recoverable behavior where recovery is possible.
- Important failures must not be silently ignored.
- Durable application state must not be corrupted by external service failures.
- Users must receive appropriate feedback about relevant long-running operation states.

### VII. Safe State Changes, Concurrency, and Idempotency

State-changing operations must remain safe under retries, duplicate requests, and concurrent execution.

- The system must account for repeated requests and concurrent actions from multiple sessions or devices.
- Critical state changes must produce consistent results under retry and concurrency.
- Operations that must be idempotent according to the requirements must not produce unintended duplicate effects.
- Race conditions must be considered for critical mutations.
- Appropriate idempotency and concurrency mechanisms must be used for sensitive state-changing operations.
- State transitions must remain valid and deterministic under repeated or concurrent requests.

### VIII. Internationalization, Responsiveness, and Inclusive UX

Internationalization and responsive behavior are foundational product concerns and must be considered when building user-facing functionality.

- Required locales and text directions must be supported correctly.
- RTL and LTR behavior must be treated as first-class requirements.
- User interfaces must remain usable across supported device sizes.
- Locale-dependent behavior must be handled intentionally.
- Content language and interface language must remain independent where required by the product.
- New UI must not introduce assumptions that break supported locales, directions, or screen sizes.
- Appropriate accessibility considerations must be incorporated into user-facing functionality.

### IX. Maintainability, Observability, and Auditability

The system must remain understandable, diagnosable, maintainable, and appropriately observable as it evolves.

- Code must remain focused, readable, composable, and consistent with established project patterns.
- Existing capabilities should be reused when they satisfy the requirement.
- Operationally significant behavior must be observable enough to diagnose failures and evaluate system behavior.
- Security-sensitive and administrative actions must be auditable where required.
- Important AI operations must provide sufficient diagnostic context for troubleshooting and evaluation.
- Unnecessary duplication, complexity, and abstraction must be avoided.
- Critical operations must remain diagnosable and traceable.

### X. Explicit Scope and Controlled Product Changes

The agent must respect the defined product scope and must not introduce behavior outside authorized requirements.

- Requirements define intended product behavior and scope.
- MVP boundaries must be preserved unless explicitly changed.
- Significant changes to durable product state must follow defined lifecycle and approval rules.
- Product behavior must not be expanded based solely on assumptions about what might be useful.
- Out-of-scope functionality must not be implemented without explicit authorization.
- Destructive or significant state changes must be handled explicitly.
- Existing product behavior must not be silently changed without an applicable requirement or approved change.

## Technical Constraints

The project must follow the technology and infrastructure constraints defined by the project Requirements and Architecture documentation.

Where explicitly required by those documents, this includes:

- Next.js App Router for the frontend.
- shadcn/ui and Tailwind CSS for the frontend UI.
- next-intl for internationalization.
- Laravel 12 and PHP 8.3+ for the backend.
- REST API with API versioning.
- MySQL as the authoritative persistent database.
- Redis for caching and queues where required.
- Laravel Horizon for queue management where required.
- Docker for containerization.
- CI/CD for automated delivery.

Technology constraints must not be interpreted as permission to introduce unnecessary complexity or dependencies.

## Quality Gates

Before considering a change complete, the agent must validate the implementation according to the nature and risk of the change.

Where applicable, validation must include:

- Relevant automated tests.
- Type checking.
- Linting.
- Build validation.
- Relevant integration or end-to-end validation.
- Authorization and ownership verification for affected functionality.
- State transition and data integrity verification for affected business logic.
- AI validation and approval-flow verification where applicable.

Testing must be proportional to the risk and behavior changed.

Business-critical, security-sensitive, state-changing, concurrency-sensitive, AI-related, and bug-fix changes require stronger validation than purely cosmetic changes.

The agent must not claim successful completion while required quality checks are failing or known critical issues remain unresolved.

## Development Governance

The agent should make normal implementation decisions autonomously using the project's requirements, architecture, existing code, and applicable development guidance.

The agent should ask for clarification when:

- Requirements materially conflict.
- An ambiguity changes observable product behavior.
- A destructive or high-risk action is required.
- A significant architectural decision cannot be safely inferred.
- A significant refactoring is required.

The agent should not request approval for ordinary implementation details that can be safely resolved using established project patterns and the simplest appropriate solution.

Small local cleanup necessary to safely implement a requested change is acceptable.

Significant refactoring that materially changes architecture, responsibilities, or unrelated areas must be identified and proposed before execution.

Changes must remain focused on the requested scope and avoid unrelated modifications.

## Governance

This Constitution defines the project's durable engineering principles.

For implementation decisions, the agent must consider the combined context of:

1. The current task prompt.
2. Project Requirements.
3. Project Context.
4. Design documentation.
5. Architecture documentation.
6. Existing code and established project patterns.
7. Applicable engineering and project guidance.

The agent must not invent requirements that are not supported by these sources.

When sources materially conflict, the conflict must be resolved before implementation if it changes observable behavior.

When principles appear to conflict, the following priority applies:

1. Security and privacy.
2. Data integrity and authorization.
3. Explicit product requirements.
4. Established architectural boundaries.
5. Maintainability and simplicity.

The simplest maintainable solution that satisfies the requirements must be preferred.

The agent must avoid:

- Speculative features.
- Premature abstraction.
- Unnecessary dependencies.
- Unnecessary architectural complexity.
- Duplication of existing capabilities.

Future extensibility should be preserved when supported by explicit requirements or when it provides clear architectural value without unnecessary complexity.

This Constitution may be amended when project-level engineering principles materially change. Amendments must be documented, remain consistent with project requirements and architecture, and must not encode temporary implementation details as permanent constitutional rules.

All significant changes should be evaluated for compliance with this Constitution before being considered complete.

**Version**: 1.0.0 | **Ratified**: 2026-09-09 | **Last Amended**: 2026-09-09