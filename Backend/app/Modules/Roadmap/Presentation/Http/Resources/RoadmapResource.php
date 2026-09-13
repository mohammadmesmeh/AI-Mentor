<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Presentation\Http\Resources;

use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RoadmapResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $version = $this->resource->currentVersion;
        $stages = [];

        if ($version instanceof RoadmapVersion) {
            foreach ($version->stages as $stage) {
                $tasks = [];

                foreach ($stage->tasks as $task) {
                    $resources = [];

                    foreach ($task->resources as $resource) {
                        $resources[] = [
                            'id' => $resource->id,
                            'title' => $resource->title,
                            'url' => $resource->url,
                            'type' => $this->enumValue($resource->getAttribute('type')),
                            'position' => $resource->position,
                        ];
                    }

                    $tasks[] = [
                        'id' => $task->id,
                        'type' => $task->taskType->code,
                        'title' => $task->title,
                        'instructions' => $task->instructions,
                        'position' => $task->position,
                        'status' => $this->enumValue($task->getAttribute('status')),
                        'is_required' => $task->is_required,
                        'estimated_minutes' => $task->estimated_minutes,
                        'depends_on_task_ids' => $task->dependencies->pluck('id')->values()->all(),
                        'resources' => $resources,
                    ];
                }

                $stages[] = [
                    'id' => $stage->id,
                    'title' => $stage->title,
                    'description' => $stage->description,
                    'position' => $stage->position,
                    'status' => $this->enumValue($stage->getAttribute('status')),
                    'estimated_minutes' => $stage->estimated_minutes,
                    'tasks' => $tasks,
                ];
            }
        }

        return [
            'id' => $this->resource->getKey(),
            'goal' => $this->resource->goal_snapshot,
            'status' => $this->enumValue($this->resource->getAttribute('status')),
            'activated_at' => $this->resource->activated_at?->toISOString(),
            'current_version' => $version instanceof RoadmapVersion ? [
                'id' => $version->id,
                'version_number' => $version->version_number,
                'source' => $this->enumValue($version->getAttribute('source')),
                'status' => $this->enumValue($version->getAttribute('status')),
                'stages' => $stages,
            ] : null,
            'created_at' => $this->resource->created_at?->toISOString(),
            'updated_at' => $this->resource->updated_at?->toISOString(),
        ];
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }

    private function enumValue(mixed $value): ?string
    {
        return $value instanceof \BackedEnum ? (string) $value->value : null;
    }
}
