<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Contracts\RoadmapGenerator;
use App\Modules\Roadmap\Application\Exceptions\InvalidGeneratedRoadmapException;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionSource;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use App\Modules\Roadmap\Domain\Enums\StageStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use App\Modules\TaskExecution\Application\Actions\CreateTaskDependency;
use App\Modules\TaskExecution\Domain\Enums\TaskStatus;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskType;
use Illuminate\Support\Facades\DB;
use LogicException;
use Throwable;

final readonly class ProcessRoadmapGeneration
{
    public function __construct(
        private RoadmapGenerator $generator,
        private ValidateGeneratedRoadmap $validator,
        private CreateTaskDependency $createTaskDependency,
        private ActivateRoadmap $activateRoadmap,
        private SetCurrentRoadmapVersion $setCurrentRoadmapVersion,
    ) {}

    public function execute(string $requestId): void
    {
        $shouldProcess = DB::transaction(function () use ($requestId): bool {
            $request = RoadmapGenerationRequest::query()->lockForUpdate()->find($requestId);
            $status = $request?->getAttribute('status');

            if ($request === null || $status !== GenerationRequestStatus::Queued) {
                return false;
            }

            $request->transitionTo(GenerationRequestStatus::Running, [
                'started_at' => now(),
                'failure_code' => null,
                'failure_message' => null,
            ]);

            return true;
        }, 3);

        if (! $shouldProcess) {
            return;
        }

        $startedAt = hrtime(true);

        try {
            $request = RoadmapGenerationRequest::query()->findOrFail($requestId);
            $snapshot = $request->getAttribute('input_snapshot');

            if (! is_array($snapshot)) {
                throw new InvalidGeneratedRoadmapException('Generation snapshot is invalid.');
            }

            $generated = $this->generator->generate($snapshot);

            DB::transaction(function () use ($requestId): void {
                $request = RoadmapGenerationRequest::query()->lockForUpdate()->findOrFail($requestId);
                $status = $request->getAttribute('status');

                if ($status !== GenerationRequestStatus::Running) {
                    throw new LogicException('Generation request is not running.');
                }

                $request->transitionTo(GenerationRequestStatus::Validating);
            }, 3);

            $this->validator->execute($generated);
            $latencyMs = max(0, (int) ((hrtime(true) - $startedAt) / 1_000_000));
            $this->persist($requestId, $generated, $latencyMs);
        } catch (Throwable $exception) {
            $failureCode = $exception instanceof InvalidGeneratedRoadmapException
                ? 'invalid_generated_roadmap'
                : 'roadmap_generation_failed';
            $this->markFailed($requestId, $failureCode);
        }
    }

    /** @param array<string, mixed> $generated */
    private function persist(string $requestId, array $generated, int $latencyMs): void
    {
        DB::transaction(function () use ($requestId, $generated, $latencyMs): void {
            $request = RoadmapGenerationRequest::query()->lockForUpdate()->findOrFail($requestId);
            $status = $request->getAttribute('status');

            if ($status !== GenerationRequestStatus::Validating) {
                throw new LogicException('Generation request is not ready to persist.');
            }

            $user = User::query()->lockForUpdate()->findOrFail($request->user_id);
            $hasActiveRoadmap = Roadmap::query()
                ->where('user_id', $user->id)
                ->whereNotNull('active_slot')
                ->exists();
            $activate = ! $hasActiveRoadmap;
            $snapshot = $request->getAttribute('input_snapshot');

            if (! is_array($snapshot)) {
                throw new InvalidGeneratedRoadmapException('Generation snapshot is invalid.');
            }

            $profile = is_array($snapshot['learning_profile'] ?? null) ? $snapshot['learning_profile'] : [];
            $goal = is_string($profile['goal'] ?? null) ? $profile['goal'] : 'Learning roadmap';
            $roadmap = $user->roadmaps()->create([
                'goal_snapshot' => $goal,
                'status' => RoadmapStatus::Ready,
                'active_slot' => null,
            ]);

            if ($activate) {
                $roadmap = $this->activateRoadmap->execute($roadmap);
            }

            $version = $roadmap->versions()->create([
                'generation_request_id' => $request->id,
                'version_number' => 1,
                'source' => RoadmapVersionSource::Generated,
                'status' => RoadmapVersionStatus::Draft,
                'change_summary' => 'Generated locally from onboarding snapshot.',
            ]);
            $taskTypes = TaskType::query()->where('is_active', true)->get()->keyBy('code');
            $tasksByKey = [];

            /** @var list<array{title: string, description: string, estimated_minutes: int, tasks: list<array{key: string, type: string, title: string, instructions: string, estimated_minutes: int, dependencies: list<string>, resources: list<array{title: string, url: string, type: string}>}>}> $stages */
            $stages = $generated['stages'];

            foreach ($stages as $stageIndex => $stageData) {
                $stage = $version->stages()->create([
                    'title' => $stageData['title'],
                    'description' => $stageData['description'],
                    'position' => $stageIndex + 1,
                    'status' => $activate && $stageIndex === 0 ? StageStatus::Active : StageStatus::Upcoming,
                    'estimated_minutes' => $stageData['estimated_minutes'],
                    'activated_at' => $activate && $stageIndex === 0 ? now() : null,
                ]);

                foreach ($stageData['tasks'] as $taskIndex => $taskData) {
                    $taskType = $taskTypes->get($taskData['type']);

                    if (! $taskType instanceof TaskType) {
                        throw new InvalidGeneratedRoadmapException('Generated task type is unavailable.');
                    }

                    $task = $stage->tasks()->create([
                        'task_type_id' => $taskType->id,
                        'title' => $taskData['title'],
                        'instructions' => $taskData['instructions'],
                        'position' => $taskIndex + 1,
                        'status' => $activate && $stageIndex === 0 && $taskIndex === 0
                            ? TaskStatus::Available
                            : TaskStatus::Upcoming,
                        'is_required' => true,
                        'estimated_minutes' => $taskData['estimated_minutes'],
                    ]);

                    foreach ($taskData['resources'] as $resourceIndex => $resourceData) {
                        $task->resources()->create([
                            'title' => $resourceData['title'],
                            'url' => $resourceData['url'],
                            'type' => $resourceData['type'],
                            'position' => $resourceIndex + 1,
                        ]);
                    }

                    $tasksByKey[$taskData['key']] = $task;
                }
            }

            foreach ($stages as $stageData) {
                foreach ($stageData['tasks'] as $taskData) {
                    foreach ($taskData['dependencies'] as $dependencyKey) {
                        $task = $tasksByKey[$taskData['key']] ?? null;
                        $dependency = $tasksByKey[$dependencyKey] ?? null;

                        if (! $task instanceof Task || ! $dependency instanceof Task) {
                            throw new InvalidGeneratedRoadmapException('Generated dependency cannot be persisted.');
                        }

                        $this->createTaskDependency->execute($task->id, $dependency->id);
                    }
                }
            }

            $this->setCurrentRoadmapVersion->execute($roadmap, $version);
            $request->transitionTo(GenerationRequestStatus::Succeeded, [
                'roadmap_id' => $roadmap->id,
                'validated_output' => $generated,
                'provider' => 'local_fake',
                'model' => null,
                'prompt_version' => 'fake-v1',
                'latency_ms' => $latencyMs,
                'failure_code' => null,
                'failure_message' => null,
                'completed_at' => now(),
            ]);
        }, 3);
    }

    private function markFailed(string $requestId, string $failureCode): void
    {
        DB::transaction(function () use ($requestId, $failureCode): void {
            $request = RoadmapGenerationRequest::query()->lockForUpdate()->find($requestId);
            $status = $request?->getAttribute('status');

            if ($request === null
                || ! in_array($status, [GenerationRequestStatus::Running, GenerationRequestStatus::Validating], true)) {
                return;
            }

            $request->transitionTo(GenerationRequestStatus::Failed, [
                'failure_code' => $failureCode,
                'failure_message' => null,
                'completed_at' => now(),
            ]);
        }, 3);
    }
}
