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
}
