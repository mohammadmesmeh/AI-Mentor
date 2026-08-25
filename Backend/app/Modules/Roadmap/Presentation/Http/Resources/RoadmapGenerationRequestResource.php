<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RoadmapGenerationRequestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getKey(),
            'status' => $this->resource->status->value,
            'roadmap_id' => $this->resource->roadmap_id,
            'failure_code' => $this->resource->failure_code,
            'created_at' => $this->resource->created_at?->toISOString(),
            'started_at' => $this->resource->started_at?->toISOString(),
            'completed_at' => $this->resource->completed_at?->toISOString(),
            'status_url' => route('api.v1.roadmap-generation-requests.show', [
                'generationRequest' => $this->resource->getKey(),
            ]),
        ];
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }
}
