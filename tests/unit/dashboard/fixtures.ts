import type {
  Resource,
  Roadmap,
  RoadmapGenerationRequest,
  RoadmapStage,
  RoadmapTask,
} from "@/lib/api/types"

// Typed builders for dashboard tests. Positions are always explicit so tests
// can hand the derivations out-of-order data on purpose.

export function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: "res-1",
    title: "Resource",
    url: "https://example.com/doc",
    type: "documentation",
    position: 1,
    ...overrides,
  }
}

export function makeTask(overrides: Partial<RoadmapTask> = {}): RoadmapTask {
  return {
    id: "task-1",
    type: "read",
    title: "Task",
    instructions: "",
    position: 1,
    status: "upcoming",
    isRequired: true,
    estimatedMinutes: 30,
    dependsOnTaskIds: [],
    resources: [],
    ...overrides,
  }
}

export function makeStage(overrides: Partial<RoadmapStage> = {}): RoadmapStage {
  return {
    id: "stage-1",
    title: "Stage",
    description: "",
    position: 1,
    status: "upcoming",
    estimatedMinutes: 60,
    tasks: [],
    ...overrides,
  }
}

export function makeRoadmap(
  overrides: Partial<Roadmap> = {},
  stages: RoadmapStage[] = []
): Roadmap {
  return {
    id: "roadmap-1",
    goal: "Goal",
    status: "active",
    activatedAt: null,
    currentVersion: {
      id: "ver-1",
      versionNumber: 1,
      source: "generated",
      status: "current",
      stages,
    },
    createdAt: "2026-09-10T09:47:00.000000Z",
    updatedAt: "2026-09-10T09:47:00.000000Z",
    ...overrides,
  }
}

export function makeRequest(
  overrides: Partial<RoadmapGenerationRequest> = {}
): RoadmapGenerationRequest {
  return {
    id: "req-1",
    status: "succeeded",
    roadmapId: "roadmap-1",
    failureCode: null,
    createdAt: "2026-09-10T09:46:59.000000Z",
    startedAt: "2026-09-10T09:46:59.000000Z",
    completedAt: "2026-09-10T09:47:00.000000Z",
    statusUrl: "http://localhost:8000/api/v1/roadmap-generation-requests/req-1",
    roadmapUrl: "http://localhost:8000/api/v1/roadmaps/roadmap-1",
    ...overrides,
  }
}
