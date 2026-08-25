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

            return TaskDependency::query()->create([
                'task_id' => $taskId,
                'depends_on_task_id' => $dependencyId,
            ]);
        });
    }
}
