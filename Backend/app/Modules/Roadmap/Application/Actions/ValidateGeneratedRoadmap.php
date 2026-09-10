<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Roadmap\Application\Exceptions\InvalidGeneratedRoadmapException;
use App\Modules\TaskExecution\Domain\Enums\TaskResourceType;
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
                    || count($task['dependencies']) !== count(array_unique($task['dependencies']))
                    || ! is_array($task['resources'] ?? null)
                    || ! array_is_list($task['resources'])
                    || count($task['resources']) < 1
                    || count($task['resources']) > 3) {
                    throw new InvalidGeneratedRoadmapException('A generated task has an invalid structure.');
                }

                $this->validateResources($task['resources']);

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

    /** @param list<mixed> $resources */
    private function validateResources(array $resources): void
    {
        $urls = [];

        foreach ($resources as $resource) {
            if (! is_array($resource)) {
                throw new InvalidGeneratedRoadmapException('A generated task resource is invalid.');
            }

            $keys = array_keys($resource);
            sort($keys);

            if ($keys !== ['title', 'type', 'url']) {
                throw new InvalidGeneratedRoadmapException('A generated task resource is invalid.');
            }

            $title = $resource['title'];
            $url = $resource['url'];
            $type = $resource['type'];
            $host = is_string($url) ? parse_url($url, PHP_URL_HOST) : null;

            if (! $this->isStringWithinLength($title, 255)
                || ! $this->isStringWithinLength($url, 2048)
                || ! in_array($type, TaskResourceType::values(), true)
                || filter_var($url, FILTER_VALIDATE_URL) === false
                || parse_url($url, PHP_URL_SCHEME) !== 'https'
                || ! is_string($host)
                || $host === '') {
                throw new InvalidGeneratedRoadmapException('A generated task resource is invalid.');
            }

            if (isset($urls[$url])) {
                throw new InvalidGeneratedRoadmapException('A generated task contains duplicate resource URLs.');
            }

            $urls[$url] = true;
        }
    }

    private function isStringWithinLength(mixed $value, int $maximum): bool
    {
        return $this->isNonEmptyString($value) && mb_strlen($value) <= $maximum;
    }
}
