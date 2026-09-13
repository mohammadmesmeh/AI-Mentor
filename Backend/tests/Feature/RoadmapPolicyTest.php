<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Policies\RoadmapPolicy;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RoadmapPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_the_owner_can_view_a_roadmap(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $roadmap = Roadmap::factory()->for($owner)->create();
        $policy = new RoadmapPolicy;

        self::assertTrue($policy->view($owner, $roadmap));
        self::assertFalse($policy->view($otherUser, $roadmap));
        self::assertFalse($policy->delete($owner, $roadmap));
    }
}
