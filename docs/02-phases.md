# Development Phases

> A phased roadmap. Each phase builds on the previous one. Dates are flexible and
> set per sprint by the supervisor.

## Phase 0: Foundation and Docs (current)

- Base Next.js project set up.
- Project documentation and phases (this doc set).
- Git workflow and task template defined.

## Phase 1: Front-end Foundation

- Clean project structure (components, layouts, sections, ui, lib).
- Landing / Home page (hero, features, footer), see **Task 01**.
- Shared UI: buttons, container, navbar, footer.
- Responsive design and dark mode.

## Phase 2: Authentication

- Sign up / Sign in pages.
- Form validation and error states.
- Session handling and protected routes.

## Phase 3: Mentor Chat UI

- Chat layout (messages list, input, streaming responses).
- Message states (loading, error, retry).
- Conversation history sidebar.

## Phase 4: Back-end and APIs

- API routes for auth, chat, plans, and progress.
- Database schema (users, plans, conversations, progress).
- Connect front-end to real endpoints.

## Phase 5: AI Integration

- Connect chat to an AI model.
- Prompting strategy for the "mentor" persona.
- Generate learning plans and recommendations.

## Phase 6: Learning Plans and Progress

- Personalized roadmap view.
- Topic tracking and progress indicators.
- Next-step recommendations.

## Phase 7: Polish and Deployment

- Accessibility (a11y) and performance passes.
- Testing and bug fixing.
- Deployment (e.g. Vercel) and environment configuration.

### Definition of Done (per phase)

- [ ] Feature works on desktop and mobile
- [ ] `pnpm lint` and `pnpm build` pass
- [ ] Code reviewed via Pull Request
- [ ] Merged into `main`
