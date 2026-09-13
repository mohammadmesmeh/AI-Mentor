<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;

final class BuildGenerationInputSnapshot
{
    public const SCHEMA_VERSION = 1;

    /** @return array<string, mixed> */
    public function execute(LearningProfile $profile, UserPreference $preference): array
    {
        $level = $profile->getAttribute('self_assessed_level');
        $methods = $profile->getAttribute('preferred_learning_methods');
        $resourceLanguage = $preference->getAttribute('resource_language');

        if (! $level instanceof \BackedEnum || ! is_array($methods) || ! $resourceLanguage instanceof \BackedEnum) {
            throw new \LogicException('A complete onboarding profile is required to build a generation snapshot.');
        }

        return [
            'schema_version' => self::SCHEMA_VERSION,
            'learning_profile' => [
                'goal' => $profile->goal,
                'self_assessed_level' => $level->value,
                'desired_outcome' => $profile->desired_outcome,
                'available_minutes_per_week' => $profile->available_minutes_per_week,
                'preferred_learning_methods' => array_values($methods),
            ],
            'preferences' => [
                'resource_language' => $resourceLanguage->value,
            ],
        ];
    }
}
