<?php

declare(strict_types=1);

namespace App\Modules\TaskExecution\Domain;

use DomainException;

final class TaskDependencyRule
{
    public function ensureDifferentTasks(string $taskId, string $dependencyId): void
    {
        if ($taskId === $dependencyId) {
            throw new DomainException('A task cannot depend on itself.');
        }
    }

    /** @param list<array{task_id: string, depends_on_task_id: string}> $existingDependencies */
    public function ensureAcyclic(string $taskId, string $dependencyId, array $existingDependencies): void
    {
        $this->ensureDifferentTasks($taskId, $dependencyId);
        $dependenciesByTask = [];

        foreach ($existingDependencies as $dependency) {
            $dependenciesByTask[$dependency['task_id']][] = $dependency['depends_on_task_id'];
        }

        $pending = [$dependencyId];
        $visited = [];

        while ($pending !== []) {
            $candidate = array_pop($pending);

            if ($candidate === $taskId) {
                throw new DomainException('Task dependencies cannot contain a cycle.');
            }

            if (isset($visited[$candidate])) {
                continue;
            }

            $visited[$candidate] = true;
            array_push($pending, ...($dependenciesByTask[$candidate] ?? []));
        }
    }
}
