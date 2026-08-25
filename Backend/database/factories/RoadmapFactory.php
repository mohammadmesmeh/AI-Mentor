<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Roadmap> */
final class RoadmapFactory extends Factory
{
    protected $model = Roadmap::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'goal_snapshot' => fake()->sentence(),
            'status' => RoadmapStatus::Draft,
            'active_slot' => null,
        ];
    }
}
