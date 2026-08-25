<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Stage;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ModelRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_model_relationships_resolve(): void
    {
        $user = User::factory()->create();
        $preference = UserPreference::factory()->for($user)->create();
        $profile = LearningProfile::factory()->for($user)->create();
        $roadmap = Roadmap::factory()->for($user)->create();
        $generationRequest = RoadmapGenerationRequest::query()->create([
            'user_id' => $user->id,
            'roadmap_id' => $roadmap->id,
            'correlation_id' => (string) Str::ulid(),
            'status' => GenerationRequestStatus::Queued,
            'input_snapshot' => ['goal' => $roadmap->goal_snapshot],
        ]);
        $version = RoadmapVersion::factory()->for($roadmap)->create([
            'generation_request_id' => $generationRequest->id,
        ]);
        $stage = Stage::factory()->for($version, 'roadmapVersion')->create();
        $task = Task::factory()->for($stage)->create();
        $roadmap->update(['current_version_id' => $version->id]);

        self::assertTrue($user->preference->is($preference));
        self::assertTrue($user->learningProfile->is($profile));
        self::assertTrue($user->roadmaps->contains($roadmap));
        self::assertTrue($user->roadmapGenerationRequests->contains($generationRequest));
        self::assertTrue($roadmap->refresh()->currentVersion->is($version));
        self::assertTrue($roadmap->generationRequests->contains($generationRequest));
        self::assertTrue($generationRequest->versions->contains($version));
        self::assertTrue($roadmap->versions->contains($version));
        self::assertTrue($version->stages->contains($stage));
        self::assertTrue($stage->tasks->contains($task));
        self::assertTrue($task->stage->is($stage));
    }
}
