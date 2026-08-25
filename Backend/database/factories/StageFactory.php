<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Roadmap\Domain\Enums\StageStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Stage;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Stage> */
final class StageFactory extends Factory
{
    protected $model = Stage::class;

    public function definition(): array
    {
        return [
            'roadmap_version_id' => RoadmapVersion::factory(),
            'title' => fake()->sentence(3),
            'position' => 1,
            'status' => StageStatus::Upcoming,
        ];
    }
}
