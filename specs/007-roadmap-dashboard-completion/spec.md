# Feature Specification: Roadmap-Driven Dashboard Completion

**Feature Branch**: `007-roadmap-dashboard-completion`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Connect the Roadmap API and complete the Dashboard implementation."

## Context

The Learning Dashboard shell and its sections were delivered by `specs/003-learning-dashboard`. Roadmap generation, status polling, and roadmap retrieval were delivered by `specs/006-frontend-api-integration`. What remains is a dashboard that is only partly driven by the learner's real roadmap:

- The roadmap the learner receives already states which task is current, which tasks are available, each task's estimated time and type, each stage's status, and each task's learning resources. Yet **Continue Learning** and **Today's Focus** still show their "not available yet" states, and **Progress** shows only the list of stage titles.
- The full roadmap and the dashboard sections are shown as two separate stacked blocks rather than one coherent workspace.
- A learner who reloads the page, or signs in again later, is not shown the roadmap they already have. They are offered roadmap generation again, because the learner's existing roadmap cannot currently be found without already knowing its identifier.
- "Mark complete" and "Skip" appear on tasks but are permanently disabled.

This feature makes the dashboard reflect the learner's real roadmap everywhere that authoritative data exists, and keeps honest "not available yet" states only where no data source exists.

## Clarifications

### Session 2026-09-24

- **Q: How should the dashboard rediscover a returning learner's roadmap after a reload or new sign-in?**
  **A:** Through the existing `v1/roadmap-generation-requests` resource, which the backend now provides for retrieving the learner's latest generation request. No new backend capability is to be requested for this. The learner's existing roadmap is determined from that latest request, based on the actual API response and contract.
- **Q: Should mark complete / skip be part of this feature?**
  **A:** The backend capabilities for task actions are not ready. The frontend must not invent or assume them, and must not simulate them with a local workaround. Story 5 is dependent on that backend work. Until it is available, the controls stay clearly disabled.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Returning learner lands on their existing roadmap (Priority: P1)

A learner who already has a roadmap signs in, or reloads the dashboard, and sees their roadmap and dashboard straight away. They are not asked to generate a new roadmap.

**Why this priority**: Without this, the dashboard only works in the same browser session where the roadmap was generated. Every returning learner, which is most visits, sees the wrong screen and may try to generate a duplicate roadmap. Nothing else in this feature matters if the learner can't get back to their roadmap.

**Independent Test**: Generate a roadmap, reload the page (and separately, sign out and sign back in). The dashboard shows the same roadmap with no generation prompt and no duplicate generation request.

**Acceptance Scenarios**:

1. **Given** a learner with an active roadmap, **When** they open the dashboard in a new session or after a reload, **Then** their current roadmap and dashboard sections are shown without any generation prompt.
2. **Given** a learner with completed onboarding and no roadmap, **When** they open the dashboard, **Then** they see the roadmap generation start screen, as today.
3. **Given** a learner whose roadmap generation is still in progress, **When** they reload the dashboard, **Then** they see the in-progress state for that same request and are not able to start a second one.
4. **Given** a learner whose most recent generation attempt failed, **When** they open the dashboard, **Then** they see the failure explanation and a way to try again.
5. **Given** the learner's roadmap cannot be loaded because of a temporary problem, **When** the dashboard opens, **Then** they see a recoverable error with a retry action, never the generation start screen as if no roadmap existed.

**How the roadmap is rediscovered** (resolved, see Clarifications): the dashboard asks the server for the learner's latest roadmap generation request, using the existing roadmap-generation-requests resource. What it shows depends on that request's outcome:

| Latest request | Dashboard shows |
|---|---|
| Succeeded | The roadmap that request produced |
| Still in progress | The in-progress state for that request |
| Failed | The failure explanation and a way to try again |
| Cancelled, or none exists | The generation start screen |

Nothing is remembered in the browser for this purpose.

---

### User Story 2 - Continue Learning shows the real next task (Priority: P1)

The dashboard's dominant **Continue Learning** section shows the learner's actual next task from their roadmap. That means its title, type (reading, video, quiz, project, assignment or coding challenge), estimated time, and which stage it belongs to. It has one clear primary action that takes the learner to that task.

**Why this priority**: The dashboard's main job (spec 003) is to answer "What should I do next?" within seconds. The roadmap already carries that answer, but the section currently says nothing is available.

**Independent Test**: With a roadmap loaded, Continue Learning shows the task the roadmap marks as current, and its primary action brings that task into view with its resources visible.

**Acceptance Scenarios**:

1. **Given** a roadmap with a task marked as current, **When** the dashboard loads, **Then** Continue Learning shows that task's title, type, estimated time and stage name.
2. **Given** a roadmap with no task marked as current but with available tasks, **When** the dashboard loads, **Then** Continue Learning shows the first available task in roadmap order, starting from the active stage.
3. **Given** a roadmap where every required task is completed, **When** the dashboard loads, **Then** Continue Learning shows a completion message instead of a task, with no fabricated next step.
4. **Given** a roadmap where no task is actionable yet and not all tasks are completed, **When** the dashboard loads, **Then** Continue Learning shows an honest "nothing to start right now" state that points to the roadmap.
5. **Given** the learner activates the primary action, **When** it completes, **Then** the chosen task is brought into view and visually highlighted within the roadmap on the same page, in at most one action.

---

### User Story 3 - Progress reflects real roadmap state (Priority: P2)

The **Progress** section shows how far the learner has actually come, derived only from the roadmap's own stage and task statuses:
- the current stage out of the total number of stages
- tasks completed out of the total
- which stages are completed, active or upcoming

**Why this priority**: It answers "How am I progressing?" Spec 003 forbade invented numbers because no data existed. The roadmap now provides authoritative statuses, so real figures can be shown.

**Independent Test**: With a roadmap whose tasks have mixed statuses, the Progress figures match a manual count of those statuses exactly.

**Acceptance Scenarios**:

1. **Given** a roadmap with 3 stages where stage 2 is active, **When** the dashboard loads, **Then** Progress shows "Stage 2 of 3" (localized) and marks stage 1 completed, stage 2 active and stage 3 upcoming.
2. **Given** a roadmap with 10 counted tasks of which 4 are completed, **When** the dashboard loads, **Then** Progress shows 4 of 10 tasks completed and a matching visual indicator (40%).
3. **Given** a newly generated roadmap with no completed tasks, **When** the dashboard loads, **Then** Progress shows 0 completed without any encouragement message implying activity that didn't happen.
4. **Given** any roadmap, **When** Progress renders, **Then** no streak, accuracy, time-spent or weekly-activity figure is shown, because none of them has a data source.

---

### User Story 4 - Today's Focus lists the actionable tasks (Priority: P2)

**Today's Focus** shows a short, ordered list of up to 3 tasks the learner can act on now, drawn from the roadmap. Each shows its title, type and estimated time, and a way to jump to it.

**Why this priority**: It turns the roadmap into a bounded next session. It is secondary to Continue Learning, which already names the single most important task.

**Independent Test**: With a roadmap that has current and available tasks, Today's Focus shows at most 3 of them, in roadmap order, each linking to the matching task in the roadmap.

**Acceptance Scenarios**:

1. **Given** a roadmap with 5 actionable tasks (current or available), **When** the dashboard loads, **Then** Today's Focus lists the first 3 in roadmap order, starting with the current task.
2. **Given** a roadmap with 1 actionable task, **When** the dashboard loads, **Then** Today's Focus lists only that task, with no filler rows.
3. **Given** a roadmap with no actionable tasks, **When** the dashboard loads, **Then** Today's Focus shows its honest empty state.
4. **Given** the learner selects a task in Today's Focus, **When** the action completes, **Then** that task is brought into view and highlighted in the roadmap.

---

### User Story 5 - Mark a task complete or skip it (Priority: P2, blocked on backend)

The learner marks a task as completed, or skips it, directly from the roadmap. The roadmap, Continue Learning, Today's Focus and Progress all update to reflect the new state.

**Why this priority**: Completing tasks is the core learning loop in the MVP requirements. It is not P1 because the dashboard delivers value (knowing what to do next) even while progress is read-only.

**Independent Test**: Mark a task complete. The task shows as completed, the next task becomes the Continue Learning task, and the Progress count increases by one without a page reload.

**Acceptance Scenarios**:

1. **Given** a current or available task, **When** the learner marks it complete, **Then** the task shows as completed and every dashboard section reflects the updated roadmap as confirmed by the server.
2. **Given** a current or available task, **When** the learner skips it, **Then** the task shows as skipped (or awaiting skip confirmation, if the server reports that) and is no longer offered as the next step.
3. **Given** the action fails, **When** the server rejects it or it can't be reached, **Then** the task keeps its previous status, and the learner sees a localized explanation and can try again.
4. **Given** the learner activates the action twice quickly, **When** requests are sent, **Then** at most one state change results.

**Availability** (resolved, see Clarifications): this story is **blocked on backend work**. The backend capabilities for completing and skipping tasks do not exist yet. Until they are added to `API_CONTRACT.md` and available, this story is not implemented and the controls stay clearly disabled (see FR-014).

- **Not allowed meanwhile:** assumed request shapes, and local "pretend" state changes.
- **Once the backend is available:** scenarios 1–4 above become the acceptance criteria.

---

### User Story 6 - One coherent workspace with safe resource access (Priority: P3)

The dashboard presents the sections and the full roadmap as a single ordered workspace. The order is greeting, then Continue Learning, then Today's Focus and Progress, then the full roadmap by stage. The same information is not repeated in two places. Each task's learning resources can be opened safely.

**Why this priority**: It's polish on top of the data now shown. The current stacked layout works but repeats the stage list and puts the roadmap above the primary action.

**Independent Test**: Load the dashboard in Arabic and English at mobile and desktop widths. The primary action is the first actionable element after the greeting, the stage list appears once, and every resource opens in a new tab.

**Acceptance Scenarios**:

1. **Given** a loaded roadmap, **When** the dashboard renders, **Then** Continue Learning appears above the full roadmap, and stage titles are not listed twice.
2. **Given** a task with learning resources, **When** the learner opens a resource, **Then** it opens in a new tab and the dashboard stays in place.
3. **Given** a resource whose link is not a safe web address, **When** the roadmap renders, **Then** that resource is shown as unavailable rather than as a clickable link.
4. **Given** a task with no resources, **When** it renders, **Then** it shows no empty resource area and no broken link.

---

### Edge Cases

- **Roadmap has no current version** (the API allows this): the dashboard shows a clear "your roadmap is not ready" state, not an empty workspace or a crash.
- **Roadmap status is not active or ready** (for example reset, archived, failed, generating or validating): the dashboard shows the state matching that status and never presents a reset or archived roadmap as the learner's active plan.
- **Stages, tasks or resources arrive out of order:** they are always displayed by their stated position.
- **Multiple tasks marked as current:** the first in roadmap order is treated as the current task.
- **Tasks replaced by an adaptation, or awaiting skip confirmation:** they are never offered as the next step.
- **Very long task or stage titles (in either language):** they wrap without breaking the layout or overflowing on narrow screens.
- **Resource or task text containing markup or scripts:** it is shown as plain text, because roadmap content is AI-generated and untrusted.
- **The learner's session expires while the dashboard is open:** the session refresh behavior from spec 006 applies, and the dashboard does not flash the generation screen.
- **The learner visits the dashboard with onboarding incomplete:** the existing onboarding-incomplete state is shown, unchanged.

## Requirements *(mandatory)*

### Functional Requirements

**Roadmap retrieval**

- **FR-001**: System MUST show a returning learner their existing roadmap, or their in-progress or failed generation request, when they open the dashboard. This covers a new session, a reload and a new sign-in. The system determines which to show from the learner's latest roadmap generation request, retrieved through the existing roadmap-generation-requests resource.
- **FR-002**: System MUST never show the roadmap generation start screen to a learner the server reports as having an active roadmap or an in-progress generation request.
- **FR-003**: System MUST treat the server's roadmap and latest generation request as the only source of truth for roadmap, stage and task state. It MUST NOT keep its own record in the browser of which roadmap or request belongs to the learner.
- **FR-004**: System MUST distinguish "learner has no roadmap" from "the roadmap could not be loaded right now", and show a retry for the latter.

**Derived dashboard content**

- **FR-005**: The **current task** MUST be determined as follows:
  1. the first task, in roadmap order, whose status is current;
  2. otherwise, the first task whose status is available, searching the active stage first and then later stages;
  3. otherwise, there is no current task.
- **FR-006**: Continue Learning MUST show the current task's title, localized task type, estimated time and stage name, with a single primary action that brings that task into view and highlights it.
- **FR-007**: Continue Learning MUST show a completion state when all counted tasks are completed, and an honest "nothing to start right now" state when there is no current task otherwise.
- **FR-008**: Today's Focus MUST list at most 3 actionable tasks (status current or available) in roadmap order, starting with the current task, and MUST show its empty state when there are none.
- **FR-009**: Progress MUST show:
  - the current stage number and the total number of stages;
  - the number of completed counted tasks out of the total counted tasks;
  - each stage's status.

  **Counted tasks** are all tasks in the current version except those with status replaced.
- **FR-010**: Progress MUST NOT show streaks, accuracy, time spent, weekly activity or any other figure that the roadmap data does not provide.
- **FR-011**: The AI Mentor Insight and Recent Activity sections MUST keep their existing honest "not available yet" states, because no data source exists for them.

**Task actions**

- **FR-012** *(deferred until the backend task-action capabilities exist)*: The system MUST let the learner mark a current or available task as completed or skipped. Any change it displays MUST be the updated state confirmed by the server, never an unconfirmed local change.
- **FR-013** *(deferred, same dependency)*: A single complete or skip action MUST result in at most one state change, even if the control is activated repeatedly or the request is retried after a network failure.
- **FR-014** *(applies now)*: Until the backend task-action capabilities are available, the complete and skip controls MUST be clearly disabled, with a localized indication that the action isn't available yet. They must never appear as working controls. The frontend MUST NOT call any task-action endpoint that isn't documented in `API_CONTRACT.md`, and MUST NOT change task status locally.

**Layout, content safety and localization**

- **FR-015**: The dashboard MUST present its content in this order: greeting, Continue Learning, Today's Focus and Progress, then the full roadmap by stage. Stage titles MUST NOT be listed twice.
- **FR-016**: Stages, tasks and resources MUST be displayed ordered by their stated position.
- **FR-017**: All roadmap-provided text MUST be displayed as plain text. Resource links MUST open in a new tab and MUST only be clickable when they are safe web addresses.
- **FR-018**: Every user-facing string MUST be localized in Arabic and English, including loading, empty, completion and error states. The dashboard currently contains a hard-coded English loading message, which must be localized as well.
- **FR-019**: All new and changed content MUST render correctly in RTL (Arabic) and LTR (English) at mobile, tablet and desktop widths with no horizontal overflow.
- **FR-020**: All new interactive elements MUST be keyboard-operable with visible focus. Changes to state caused by a task action MUST be announced to assistive technology.

### Key Entities

- **Roadmap**: The learner's personalized learning plan. It has a lifecycle status (for example active, completed, reset or archived) and one current version.
- **Roadmap Version**: The ordered set of stages currently in effect for a roadmap. It may be absent.
- **Stage**: An ordered group of tasks with a status (upcoming, active or completed) and an estimated duration.
- **Task**: A single learning step. It has:
  - a type
  - a title
  - instructions
  - an estimated duration
  - a required or optional flag
  - dependencies on other tasks
  - a status (upcoming, available, current, completed, skip pending, skipped or replaced)
  - ordered resources
- **Resource**: An external learning material attached to a task (documentation, article, video or course), with a title and a web address.
- **Roadmap Generation Request**: A single attempt to produce a roadmap, with a lifecycle ending in success, failure or cancellation. It links to the resulting roadmap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of returning learners who have a roadmap see it on the dashboard after a reload or new sign-in, with zero duplicate generation requests caused by returning to the dashboard.
- **SC-002**: A learner can identify their next task and reach it within 5 seconds and at most one action from landing on the dashboard.
- **SC-003**: For any roadmap, the Continue Learning task, the Today's Focus list and every Progress figure match a manual count of the roadmap's statuses in 100% of test cases, including the edge cases listed above.
- **SC-004**: 0 figures, tasks, recommendations or activity events are displayed that do not come from the learner's roadmap data.
- **SC-005**: Now: 0 task status changes occur without server confirmation, and the complete and skip controls are disabled in 100% of renders. Once the backend task actions exist: the dashboard reflects a completed or skipped task in every section within 2 seconds of the server confirming it, without a page reload.
- **SC-006**: 0 layout overflows or untranslated strings on the dashboard in Arabic and English at 320px, 768px and 1280px widths.
- **SC-007**: 0 roadmap-provided strings are interpreted as markup, and 0 resource links with unsafe addresses are clickable.

## Assumptions

- The dashboard shell, section cards, generation flow and roadmap retrieval from specs 003 and 006 are kept and extended, not rebuilt.
- "Counted tasks" for progress exclude only replaced tasks. Skipped tasks count toward the total but not as completed. Optional tasks count the same as required ones. These can be revisited in clarification.
- Today's Focus is capped at 3 tasks, the cap spec 003 anticipated.
- Continue Learning's primary action navigates within the dashboard to the task in the roadmap. There is no separate task-detail page in this feature.
- AI Mentor Insight and Recent Activity stay in their "not available yet" states. Mentor chat, adaptation proposals, streaks and achievements are out of scope.
- Roadmap regeneration, reset, goal change, activating a different roadmap version and cancelling generation are out of scope.
- The backend is owned by another developer.

## Dependencies

- **Latest generation request (Story 1): available on the backend, but not yet documented in this repo.**
  - Per the clarification, the backend now provides retrieval of the learner's latest request through `v1/roadmap-generation-requests`.
  - This repo's `API_CONTRACT.md` (§4 and §14–15) still documents only creating a request and fetching one by identifier. The local backend snapshot matches that.
  - Before `/speckit-plan`, the contract MUST document the actual request and response for this retrieval: the path and method, the "no request yet" response, and whether the result includes the roadmap identifier and status. Implementation must follow the actual API response, not an assumed shape.
- **Task actions (Story 5): not available.** Blocked until the backend adds complete and skip capabilities and they are documented in `API_CONTRACT.md`.
