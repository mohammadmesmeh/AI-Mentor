<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Actions\ActivateRoadmap;
use App\Modules\Roadmap\Domain\ActiveRoadmapSlot;
use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RoadmapActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_activation_action_moves_the_single_active_slot(): void
    {
        $user = User::factory()->create();
        $previous = Roadmap::factory()->for($user)->create([
            'active_slot' => ActiveRoadmapSlot::CURRENT,
            'status' => RoadmapStatus::Active,
        ]);
        $next = Roadmap::factory()->for($user)->create();

        $activated = (new ActivateRoadmap)->execute($next);

        self::assertNull($previous->refresh()->active_slot);
        self::assertSame(ActiveRoadmapSlot::CURRENT, $activated->active_slot);
        self::assertSame(RoadmapStatus::Active, $activated->status);
    }
}
