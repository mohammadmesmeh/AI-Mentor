<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Roadmap\Application\Actions\SetCurrentRoadmapVersion;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class SetCurrentRoadmapVersionTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_version_transition_is_atomic_and_supersedes_the_previous_version(): void
    {
        $roadmap = Roadmap::factory()->create();
        $previous = RoadmapVersion::factory()->for($roadmap)->create([
            'version_number' => 1,
            'status' => RoadmapVersionStatus::Current,
        ]);
        $next = RoadmapVersion::factory()->for($roadmap)->create([
            'version_number' => 2,
        ]);
        $roadmap->update(['current_version_id' => $previous->id]);

        $updated = (new SetCurrentRoadmapVersion)->execute($roadmap, $next);

        self::assertSame($next->id, $updated->current_version_id);
        self::assertSame(RoadmapVersionStatus::Superseded, $previous->refresh()->status);
        self::assertSame(RoadmapVersionStatus::Current, $next->refresh()->status);
    }

    public function test_version_from_another_roadmap_is_rejected(): void
    {
        $roadmap = Roadmap::factory()->create();
        $foreignVersion = RoadmapVersion::factory()->create();

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('must belong to the roadmap');

        (new SetCurrentRoadmapVersion)->execute($roadmap, $foreignVersion);
    }
}
