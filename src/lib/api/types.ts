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

export interface Session {
  tokenType: string
  accessToken: string
  expiresAt: number
  refreshToken: string
  refreshExpiresAt: number
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

export interface LearningProfile {
  id: string
  goal: string
  selfAssessedLevel: SelfAssessedLevel
  desiredOutcome: string | null
  availableMinutesPerWeek: number
  preferredLearningMethods: LearningMethod[] | null
  createdAt: string
  updatedAt: string
}

export type MissingField =
  | "goal"
  | "self_assessed_level"
  | "desired_outcome"
  | "available_minutes_per_week"
  | "preferred_learning_methods"
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
  currentVersion: RoadmapVersion | null
  createdAt: string
  updatedAt: string
}