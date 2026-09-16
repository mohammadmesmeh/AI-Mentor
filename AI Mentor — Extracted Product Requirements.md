# AI Mentor — Extracted Product Requirements

## 1. User and Account Requirements

- The system must allow users to create an account and sign in and out.
- Users must be able to manage their basic account information.
- Users must be able to delete their account.
- The system must define a clear data-retention policy after account deletion.
- Each user must own and access only their own learning data.
- The system must prevent users from accessing another user's data.
- The platform must support Arabic and English.
- Arabic must support RTL, and English must support LTR.

## 2. Onboarding Requirements

- The platform must provide an initial onboarding flow.
- Users must define their learning goal.
- Users must provide their current self-assessed level.
- Users must define the amount of time available for learning.
- The system must use onboarding information when generating the learning plan.
- The platform must be domain-agnostic.
- The platform must support learning goals across multiple domains, including:
  - Programming
  - Design
  - Marketing
  - Languages
  - Business
  - Career switching
  - Skill development
  - Other learning domains

## 3. Roadmap Generation Requirements

- Users must be able to create a learning roadmap based on their goal.
- The roadmap must be generated using AI.
- The roadmap must be personalized based on:
  - User goal
  - Current level
  - Available learning time
  - Relevant user preferences
  - Domain requirements
- A roadmap must be divided into stages.
- Each stage must contain tasks.
- Generated roadmaps must be persisted as durable application data.
- The persisted roadmap must be the primary source of truth for the application.
- The system must not rely on regenerating the roadmap from AI on every request.
- The MVP must allow only one active roadmap per user.

## 4. Task Requirements

The system must support the following task types:

- Read
- Watch
- Quiz
- Project
- Assignment
- Coding Challenge

Users must be able to:

- Mark a task as complete.
- Skip a task.
- Work with tasks that have been replaced.
- Work with tasks that have been removed.
- Identify required and effective tasks.
- Track progress based on tasks.

## 5. Task Completion Requirements

- Task completion must be based on the user's declaration that the task was completed.
- Mandatory AI grading must not be required in the MVP.
- Mandatory proof of completion must not be required in the MVP.
- Completed tasks must contribute to user progress.
- Tasks must have equal weight in progress calculations unless explicitly defined otherwise.

## 6. Stage Completion Requirements

- A stage must be considered complete when all required and effective tasks within it are completed.
- Replaced tasks must not count as active required tasks.
- Removed tasks must not count as active required tasks.

## 7. Task Skip Requirements

When a user skips a task:

- The system must provide a skip workflow.
- A skip reason may be recorded.
- The Mentor may recommend:
  - Keep
  - Replace
  - Skip
- The system may use the skip reason and context in future recommendations.

## 8. Progress Requirements

- The platform must display user progress through the roadmap.
- Progress must be calculated based on tasks.
- Progress calculation must account for:
  - Completed tasks
  - Skipped tasks
  - Replaced tasks
  - Removed tasks
  - Optional tasks
  - Tasks added later

## 9. Streak Requirements

- The platform must support learning streaks.
- A user earns a streak day when they complete at least one task during that calendar day.
- The system must not automatically reschedule tasks because of a missed day.
- Streak calculation must use a defined user timezone.

## 10. Available Learning Time Requirements

- Users must be able to specify their available learning time.
- Available time must be used to determine roadmap pace.
- Available time must not imply a mandatory calendar schedule.
- The MVP must not schedule users on a calendar.
- The system must not automatically reschedule the roadmap because of a missed day.

## 11. Goal Change Requirements

- Users must be able to change their learning goal.
- A goal change must be treated as a significant change to the current roadmap.
- The roadmap must be rebuilt to match the new goal.
- The current roadmap must be handled according to a defined lifecycle.

## 12. Roadmap Reset Requirements

- Users must be able to reset their roadmap.
- Reset must remove the current active roadmap.
- After reset, the user must be able to create a new roadmap.
- Reset must be treated as a clearly communicated destructive operation.

## 13. Roadmap Regeneration Requirements

- Users must be able to regenerate their roadmap before learning begins.
- After learning begins, the current roadmap must not be silently changed.
- Significant changes after learning begins must be handled through:
  - An adaptation proposal, or
  - Reset and rebuild.

## 14. AI Mentor Requirements

- The platform must provide an AI Mentor.
- Users must be able to ask questions.
- Users must be able to request help.
- The Mentor must provide explanations and guidance.
- Guidance must be relevant to the user's roadmap and current task.
- Mentor guidance must consider the user's progress.
- The Mentor must be context-aware.

## 15. Mentor Context Requirements

The Mentor context must primarily include:

- User goal
- Current stage
- Current task
- User progress
- Relevant preferences

The context sent to AI providers must be compact and must not include unnecessary user data.

## 16. Mentor Action Requirements

- The AI Mentor may suggest changes to the roadmap.
- The AI Mentor must not silently modify the roadmap.
- Users must explicitly approve significant roadmap changes.
- Users must be able to accept or reject proposals.

## 17. Mentor Chat Requirements

- The platform must provide a single Mentor chat stream.
- The chat must support contextual conversations.
- Chat history must be handled according to a defined persistence and reset policy.
- Unnecessary user data must not be sent to AI providers.

## 18. Roadmap Adaptation Requirements

The system must be able to generate roadmap adaptation proposals based on:

- User progress
- Task difficulty
- User requests
- Changing learning needs
- Mentor interactions

Potential adaptation operations include:

- Add a task
- Remove a task
- Replace a task
- Reorder tasks
- Change learning level
- Change time estimate

All significant changes must be presented as proposals before they are applied.

## 19. Resource Discovery Requirements

- The system must discover external learning resources.
- Resources may include:
  - Articles
  - Videos
  - Courses
  - Educational websites
  - Other relevant learning materials
- Resource discovery must consider:
  - Task topic
  - Task attributes
  - User level
  - Resource language
  - Learning needs

## 20. Resource Ranking Requirements

Discovered resources must be ranked according to relevance and quality.

Ranking should consider factors such as:

- Topic relevance
- User level
- Language
- Quality
- Freshness
- Source trustworthiness
- Accessibility

## 21. Resource Validation Requirements

Resources must be validated before being treated as trusted resources.

Validation should consider:

- URL validity
- Accessibility
- HTTPS
- Source quality
- Content freshness
- Author/source information
- Language
- Relevance to the task
- Duplicate resources
- Redirects
- Safety factors

The AI must not be the sole authority for declaring a URL trusted.

## 22. Resource Freshness Requirements

- The system must support resource freshness preferences.
- Resource language must be independent from UI language.
- A user may have an Arabic UI while receiving an English learning resource.

## 23. AI Roadmap Engine Requirements

The platform must provide an AI Roadmap Engine.

Inputs may include:

- Learning profile
- Learning goal
- Current level
- Curriculum and roadmap criteria

The output must be structured data/JSON.

AI output must not be persisted directly.

The output must pass through:

1. Schema validation
2. Semantic validation
3. Business-rule validation
4. Persistence

## 24. AI Mentor Engine Requirements

The Mentor Engine must receive:

- User message
- Current context
- Current roadmap
- Current task
- User progress

It must return:

- A textual response
- Optional typed actions when needed

Actions that affect the roadmap must require user approval.

## 25. AI Provider Requirements

- The platform must support multiple AI providers.
- Gemini and Grok are the baseline providers.
- The platform must use an abstraction layer so providers can be switched or used as alternatives.

## 26. AI Error Handling Requirements

The system must handle:

- AI provider failures
- Timeouts
- Rate limits
- Invalid responses
- Invalid JSON
- Schema validation failures
- Validation failures
- Retry requirements

## 27. AI Privacy Requirements

The platform must define which data can be sent to AI providers.

Unnecessary data must not be sent, including:

- Authentication data
- Session information
- Tokens
- Unrelated private data
- Unnecessary personally identifiable information

## 28. AI Observability Requirements

The system should record operational AI information needed for debugging and evaluation, including:

- Provider
- Model
- Prompt version
- Schema version
- Request ID
- Execution time
- Token usage
- Validation result
- Operation status

## 29. Gamification Requirements

The MVP must provide a simple gamification system.

It must include:

- Streaks
- Achievements

Achievements must be based on dynamic rules.

## 30. Achievement Requirements

The system must calculate achievements based on user behavior, such as:

- Completing a specific number of tasks
- Maintaining a learning streak
- Completing stages

The MVP should use a simple rules engine for achievements.

## 31. Administration Requirements

The platform must support a Platform Administrator role.

Administrative capabilities must be:

- Permission-controlled
- Audited

Backend authorization must enforce administrative permissions; UI visibility alone must not be considered authorization.

## 32. Data Ownership and Authorization Requirements

- Users must only access their own data.
- The backend must enforce ownership checks.
- UI restrictions must not be relied upon for security.
- Ownership protection must cover:
  - Roadmaps
  - Tasks
  - Progress
  - Chat
  - Resources
  - Account data

## 33. Asynchronous Job Requirements

Heavy operations, including AI generation, must support asynchronous execution.

Jobs must have explicit states such as:

- QUEUED
- PROCESSING
- COMPLETED
- FAILED
- RETRYING
- CANCELLED

The frontend must be able to determine and display the current operation state.

## 34. Concurrency Requirements

The system must handle concurrent actions from multiple devices or sessions, including:

- Completing the same task from two devices.
- Resetting while another operation is running.
- Accepting the same proposal concurrently.
- Generating a roadmap concurrently.

## 35. Idempotency Requirements

Sensitive operations must not execute multiple times when the same request is submitted repeatedly.

This applies especially to:

- Generate
- Regenerate
- Reset
- Complete Task
- Accept Proposal
- Reject Proposal

## 36. Roadmap History Requirements

- The data model should support roadmap history in the future.
- The system should be prepared for:
  - Archive
  - History
- Multiple active roadmaps are not part of the MVP.

## 37. Frontend Requirements

The application must be:

- Responsive
- Mobile-friendly
- Tablet-friendly
- Desktop-friendly
- Built with Next.js App Router
- Built with shadcn/ui
- Built with Tailwind CSS
- Integrated with next-intl
- Compatible with RTL and LTR

## 38. Backend API Requirements

The backend must use:

- Laravel 12
- PHP 8.3+
- REST API
- API versioning, such as `/api/v1`

Frontend and backend responsibilities must remain separated.

## 39. Database and Infrastructure Requirements

The platform must use:

- MySQL as the authoritative database
- Redis for caching and queues
- Laravel Horizon for queue management
- Docker
- CI/CD

## 40. MVP Functional Requirements

The MVP must support:

- Account registration and authentication
- Onboarding
- Goal definition
- Level definition
- Available-time definition
- AI roadmap generation
- Roadmap persistence
- Stages
- Tasks
- Task completion
- Task skipping
- Progress tracking
- Streaks
- Resource discovery
- Resource validation
- Mentor chat
- Adaptation proposals
- Roadmap regeneration before learning begins
- Roadmap reset
- Goal changes and roadmap rebuilding
- Achievements
- Arabic and English
- RTL and LTR
- Account deletion

## 41. MVP Out-of-Scope Requirements

The following are explicitly excluded from the MVP:

- Multiple concurrent active roadmaps
- Template marketplace
- Mandatory quizzes
- Mandatory proof of completion
- AI grading gate
- Calendar scheduling
- Automatic rescheduling
- Reminders
- Payments
- Social/community features
- Native mobile applications
- Offline state mutation
- Enterprise SSO
- Team analytics

## 42. Core Product Flow

The core product flow must support:

**User defines a goal → the system understands the user's level and available time → AI generates a roadmap → the backend validates and persists it → the user learns and completes tasks → the system tracks progress → the Mentor provides contextual guidance → AI proposes adaptations when needed → the user accepts or rejects the proposed changes.**