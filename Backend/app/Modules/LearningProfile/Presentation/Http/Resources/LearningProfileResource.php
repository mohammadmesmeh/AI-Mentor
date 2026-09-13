<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Presentation\Http\Resources;

use App\Modules\LearningProfile\Domain\Enums\SelfAssessedLevel;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use LogicException;

final class LearningProfileResource extends JsonResource
{
    /** @return array{id: string, goal: string, self_assessed_level: string, desired_outcome: ?string, available_minutes_per_week: int, preferred_learning_methods: ?list<string>, created_at: ?string, updated_at: ?string} */
    public function toArray(Request $request): array
    {
        /** @var LearningProfile $profile */
        $profile = $this->resource;
        $level = $profile->getAttribute('self_assessed_level');
        $methods = $profile->getAttribute('preferred_learning_methods');

        if (! $level instanceof SelfAssessedLevel || ($methods !== null && ! is_array($methods))) {
            throw new LogicException('Learning profile casts are not configured.');
        }

        $desiredOutcome = $profile->getAttribute('desired_outcome');

        return [
            'id' => (string) $profile->getKey(),
            'goal' => (string) $profile->getAttribute('goal'),
            'self_assessed_level' => $level->value,
            'desired_outcome' => is_string($desiredOutcome) ? $desiredOutcome : null,
            'available_minutes_per_week' => (int) $profile->getAttribute('available_minutes_per_week'),
            'preferred_learning_methods' => is_array($methods) ? array_values($methods) : null,
            'created_at' => $profile->created_at?->toISOString(),
            'updated_at' => $profile->updated_at?->toISOString(),
        ];
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }
}
