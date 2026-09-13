<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Application\Actions;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Domain\Enums\LearningMethod;
use App\Modules\LearningProfile\Domain\Enums\SelfAssessedLevel;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;

final class CalculateOnboardingStatus
{
    /** @var list<string> */
    public const REQUIRED_FIELDS = [
        'goal',
        'self_assessed_level',
        'desired_outcome',
        'available_minutes_per_week',
        'preferred_learning_methods',
        'resource_language',
    ];

    /** @return array{completed: bool, missing_fields: list<string>} */
    public function execute(User $user): array
    {
        $profile = $user->learningProfile()->first();
        $preference = $user->preference()->first();

        $missingFields = array_values(array_filter(
            self::REQUIRED_FIELDS,
            fn (string $field): bool => $field === 'resource_language'
                ? $preference === null || ! $preference->getAttribute('resource_language') instanceof ResourceLanguage
                : $profile === null || $this->isMissing($profile, $field),
        ));

        return ['completed' => $missingFields === [], 'missing_fields' => $missingFields];
    }

    private function isMissing(LearningProfile $profile, string $field): bool
    {
        $value = $profile->getAttribute($field);

        return match ($field) {
            'goal', 'desired_outcome' => ! is_string($value) || trim($value) === '',
            'self_assessed_level' => ! $value instanceof SelfAssessedLevel,
            'available_minutes_per_week' => ! is_int($value) || $value < 1,
            'preferred_learning_methods' => ! is_array($value)
                || $value === []
                || $this->containsInvalidLearningMethod($value),
            default => true,
        };
    }

    /** @param array<mixed> $methods */
    private function containsInvalidLearningMethod(array $methods): bool
    {
        foreach ($methods as $method) {
            if (! is_string($method) || LearningMethod::tryFrom($method) === null) {
                return true;
            }
        }

        return false;
    }
}
