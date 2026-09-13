<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class OnboardingStatusResource extends JsonResource
{
    /** @return array{completed: bool, missing_fields: list<string>} */
    public function toArray(Request $request): array
    {
        /** @var array{completed: bool, missing_fields: list<string>} $status */
        $status = $this->resource;

        return $status;
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }
}
