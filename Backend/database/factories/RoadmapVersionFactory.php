<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Roadmap\Domain\Enums\RoadmapVersionSource;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<RoadmapVersion> */
final class RoadmapVersionFactory extends Factory
{
    protected $model = RoadmapVersion::class;

    public function definition(): array
    {
        return [
            'roadmap_id' => Roadmap::factory(),
            'version_number' => 1,
            'source' => RoadmapVersionSource::Generated,
            'status' => RoadmapVersionStatus::Draft,
        ];
    }
}
