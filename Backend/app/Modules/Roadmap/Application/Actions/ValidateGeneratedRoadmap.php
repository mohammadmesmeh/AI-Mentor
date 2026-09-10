<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Roadmap\Application\Exceptions\InvalidGeneratedRoadmapException;
use App\Modules\TaskExecution\Domain\TaskDependencyRule;

final readonly class ValidateGeneratedRoadmap
{
    private const TASK_TYPES = ['read', 'watch', 'quiz', 'project', 'assignment', 'coding_challenge'];

    public function __construct(private TaskDependencyRule $dependencyRule) {}

    /** @param array<string, mixed> $roadmap */
    public function execute(array $roadmap): void
    {
        $stages = $roadmap['stages'] ?? null;

        if (! is_array($stages) || count($stages) !== 3 || ! array_is_list($stages)) {
            throw new InvalidGeneratedRoadmapException('A generated roadmap must contain exactly three stages.');
        }

        $taskKeys = [];
        $dependencies = [];

        foreach ($stages as $stage) {
            if (! is_array($stage)
                || ! $this->isNonEmptyString($stage['title'] ?? null)
                || ! $this->isNonEmptyString($stage['description'] ?? null)
                || ! $this->isPositiveInteger($stage['estimated_minutes'] ?? null)
                || ! is_array($stage['tasks'] ?? null)
                || count($stage['tasks']) !== 3
                || ! array_is_list($stage['tasks'])) {
                throw new InvalidGeneratedRoadmapException('A generated stage has an invalid structure.');
            }

            $taskMinutes = 0;

            foreach ($stage['tasks'] as $task) {
                if (! is_array($task)
                    || ! $this->isNonEmptyString($task['key'] ?? null)
                    || isset($taskKeys[$task['key']])
                    || ! in_array($task['type'] ?? null, self::TASK_TYPES, true)
                    || ! $this->isNonEmptyString($task['title'] ?? null)
                    || ! $this->isNonEmptyString($task['instructions'] ?? null)
                    || ! $this->isPositiveInteger($task['estimated_minutes'] ?? null)
                    || ! is_array($task['dependencies'] ?? null)
                    || ! array_is_list($task['dependencies'])
                    || count($task['dependencies']) !== count(array_filter($task['dependencies'], 'is_string'))
                    || count($task['dependencies']) !== count(array_unique($task['dependencies']))) {
                    throw new InvalidGeneratedRoadmapException('A generated task has an invalid structure.');
                }

                $taskKeys[$task['key']] = true;
                $taskMinutes += $task['estimated_minutes'];
                $dependencies[$task['key']] = $task['dependencies'];
            }

            if ($taskMinutes !== $stage['estimated_minutes']) {
                throw new InvalidGeneratedRoadmapException('Stage duration must equal its task durations.');
            }
        }

        $edges = [];

        foreach ($dependencies as $taskKey => $dependencyKeys) {
            foreach ($dependencyKeys as $dependencyKey) {
                if (! is_string($dependencyKey) || ! isset($taskKeys[$dependencyKey])) {
                    throw new InvalidGeneratedRoadmapException('A generated task dependency does not exist.');
                }

                try {
                    $this->dependencyRule->ensureAcyclic($taskKey, $dependencyKey, $edges);
                } catch (\DomainException $exception) {
                    throw new InvalidGeneratedRoadmapException($exception->getMessage(), previous: $exception);
                }

                $edges[] = ['task_id' => $taskKey, 'depends_on_task_id' => $dependencyKey];
            }
        }
    }

    private function isNonEmptyString(mixed $value): bool
    {
        return is_string($value) && trim($value) !== '';
    }

    private function isPositiveInteger(mixed $value): bool
    {
        return is_int($value) && $value > 0;
    }
}
