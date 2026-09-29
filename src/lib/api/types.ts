export type UserStatus = "active" | "suspended" | "deletion_requested"

export interface User {
  id: string
  name: string
  email: string
  status: UserStatus
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
}

/**
 * The in-memory part of a session: the access token only. The refresh token
 * lives in the HttpOnly cookie of the session route (contract §3 rule 4).
 */
export interface Session {
  tokenType: string
  accessToken: string
  expiresAt: number
}

export type UiLocale = "ar" | "en"
export type ResourceLanguage = "ar" | "en" | "both"

export interface Preferences {
  uiLocale: UiLocale
  resourceLanguage: ResourceLanguage
  timezone: string
  updatedAt: string
}

export type SelfAssessedLevel = "complete_beginner" | "some_experience" | "intermediate"
export type LearningMethod = "hands_on_projects" | "reading_docs" | "video_walkthroughs" | "quizzes_drills"
/** Contract §12: where resources should come from. Array order is the learner's priority. */
export type ResourceSource = "youtube" | "official_documentation" | "articles" | "courses"

export interface LearningProfile {
  id: string
  goal: string
  selfAssessedLevel: SelfAssessedLevel
  desiredOutcome: string | null
  availableMinutesPerWeek: number
  preferredLearningMethods: LearningMethod[] | null
  /** null for legacy records created before the field existed. */
  preferredResourceSources: ResourceSource[] | null
  createdAt: string
  updatedAt: string
}

export type MissingField =
  | "goal"
  | "self_assessed_level"
  | "desired_outcome"
  | "available_minutes_per_week"
  | "preferred_learning_methods"
  | "preferred_resource_sources"
  | "resource_language"

export interface OnboardingStatus {
  completed: boolean
  missingFields: MissingField[]
}

export type GenerationStatus = "queued" | "running" | "validating" | "succeeded" | "failed" | "cancelled"

export interface RoadmapGenerationRequest {
  id: string
  status: GenerationStatus
  roadmapId: string | null
  failureCode: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  statusUrl: string
  roadmapUrl: string | null
}

export type RoadmapStatus =
  | "draft"
  | "generating"
  | "validating"
  | "ready"
  | "active"
  | "completed"
  | "failed"
  | "reset"
  | "archived"

export type VersionSource = "generated" | "regenerated" | "manual" | "adaptation"
export type VersionStatus = "draft" | "current" | "superseded" | "archived"
export type StageStatus = "upcoming" | "active" | "completed"
export type TaskStatus =
  | "upcoming"
  | "available"
  | "current"
  | "completed"
  | "skip_pending"
  | "skipped"
  | "replaced"
export type TaskType = "read" | "watch" | "quiz" | "project" | "assignment" | "coding_challenge"
export type ResourceType = "documentation" | "article" | "video" | "course"

/**
 * Server-calculated progress (contract §16). Counts only `is_required` tasks;
 * never computed or sent by the client.
 */
export interface Progress {
  completedTasks: number
  totalTasks: number
  percentage: number
}

export interface Resource {
  id: string
  title: string
  url: string
  type: ResourceType
  position: number
}

export interface RoadmapTask {
  id: string
  type: TaskType
  title: string
  instructions: string
  position: number
  status: TaskStatus
  isRequired: boolean
  estimatedMinutes: number
  completedAt?: string | null
  dependsOnTaskIds: string[]
  resources: Resource[]
}

export interface RoadmapStage {
  id: string
  title: string
  description: string
  position: number
  status: StageStatus
  estimatedMinutes: number
  progress?: Progress
  tasks: RoadmapTask[]
}

export interface RoadmapVersion {
  id: string
  versionNumber: number
  source: VersionSource
  status: VersionStatus
  stages: RoadmapStage[]
}

export interface Roadmap {
  id: string
  goal: string
  status: RoadmapStatus
  activatedAt: string | null
  completedAt?: string | null
  progress?: Progress
  currentVersion: RoadmapVersion | null
  createdAt: string
  updatedAt: string
}

/** `GET /tasks/{task}` (contract §19). */
export interface TaskDetail {
  id: string
  type: TaskType
  title: string
  instructions: string
  position: number
  status: TaskStatus
  isRequired: boolean
  estimatedMinutes: number
  completedAt: string | null
  /** Server rule: roadmap active + owns the active slot, task available/current, all dependencies completed. */
  canComplete: boolean
  dependsOnTaskIds: string[]
  dependencies: { id: string; title: string; status: TaskStatus }[]
  resources: Resource[]
  stage: { id: string; title: string; position: number; status: StageStatus; progress: Progress }
  roadmap: { id: string; goal: string; status: RoadmapStatus; active: boolean; progress: Progress }
}