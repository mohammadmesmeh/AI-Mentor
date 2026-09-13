<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class HealthResource extends JsonResource
{
    /** @return array{status: string, service: string} */
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->resource->status,
            'service' => $this->resource->service,
        ];
    }

    /** @return array{meta: array{request_id: string}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $this->resource->request_id]];
    }
}
