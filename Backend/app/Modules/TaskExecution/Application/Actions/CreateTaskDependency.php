<?php

declare(strict_types=1);

namespace App\Modules\TaskExecution\Application\Actions;

use App\Modules\TaskExecution\Domain\TaskDependencyRule;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskDependency;
use DomainException;
use Illuminate\Support\Facades\DB;

final readonly class CreateTaskDependency
{
    public function __construct(private TaskDependencyRule $rule) {}

    public function execute(string $taskId, string $dependencyId): TaskDependency
    {
        $this->rule->ensureDifferentTasks($taskId, $dependencyId);

        return DB::transaction(function () use ($taskId, $dependencyId): TaskDependency {
            $tasks = Task::query()
                ->with('stage:id,roadmap_version_id')
                ->whereKey([$taskId, $dependencyId])
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $task = $tasks->get($taskId);
            $dependency = $tasks->get($dependencyId);

            if (! $task instanceof Task || ! $dependency instanceof Task) {
                throw new DomainException('Both tasks must exist.');
            }

            if ($task->stage->roadmap_version_id !== $dependency->stage->roadmap_version_id) {
                throw new DomainException('Task dependencies must belong to the same roadmap version.');
            }

            /** @var list<array{task_id: string, depends_on_task_id: string}> $existingDependencies */
            $existingDependencies = DB::table('task_dependencies')
                ->join('tasks', 'task_dependencies.task_id', '=', 'tasks.id')
                ->join('stages', 'tasks.stage_id', '=', 'stages.id')
                ->where('stages.roadmap_version_id', $task->stage->roadmap_version_id)
                ->get(['task_dependencies.task_id', 'task_dependencies.depends_on_task_id'])
                ->map(static fn (object $row): array => [
                    'task_id' => (string) $row->task_id,
                    'depends_on_task_id' => (string) $row->depends_on_task_id,
                ])->all();

            $this->rule->ensureAcyclic($taskId, $dependencyId, $existingDependencies);

            return TaskDependency::query()->create([
                'task_id' => $taskId,
                'depends_on_task_id' => $dependencyId,
            ]);
        });
    }
}
