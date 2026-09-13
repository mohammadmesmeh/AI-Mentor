<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Domain\Enums\LearningMethod;
use App\Modules\LearningProfile\Domain\Enums\SelfAssessedLevel;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<LearningProfile> */
final class LearningProfileFactory extends Factory
{
    protected $model = LearningProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'goal' => fake()->sentence(),
            'self_assessed_level' => SelfAssessedLevel::CompleteBeginner,
            'desired_outcome' => fake()->sentence(),
            'available_minutes_per_week' => 300,
            'preferred_learning_methods' => [
                LearningMethod::ReadingDocs->value,
                LearningMethod::HandsOnProjects->value,
            ],
        ];
    }
}
