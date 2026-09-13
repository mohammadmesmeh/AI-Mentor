<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use App\Modules\Roadmap\Domain\ActiveRoadmapSlot;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Stage;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskDependency;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class CoreSchemaConstraintsTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_receive_ulid_identifiers(): void
    {
        $user = User::factory()->create();

        self::assertTrue(Str::isUlid($user->id));
    }

    public function test_user_can_have_only_one_preferences_record(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();

        $this->expectException(QueryException::class);
        UserPreference::factory()->for($user)->create();
    }

    public function test_user_can_have_only_one_learning_profile(): void
    {
        $user = User::factory()->create();
        LearningProfile::factory()->for($user)->create();

        $this->expectException(QueryException::class);
        LearningProfile::factory()->for($user)->create();
    }

    public function test_user_cannot_have_two_active_roadmaps(): void
    {
        $user = User::factory()->create();
        Roadmap::factory()->for($user)->create(['active_slot' => ActiveRoadmapSlot::CURRENT]);

        $this->expectException(QueryException::class);
        Roadmap::factory()->for($user)->create(['active_slot' => ActiveRoadmapSlot::CURRENT]);
    }

    public function test_user_can_have_multiple_inactive_roadmaps(): void
    {
        $user = User::factory()->create();
        Roadmap::factory()->count(2)->for($user)->create(['active_slot' => null]);

        self::assertSame(2, $user->roadmaps()->count());
    }

    public function test_mysql_rejects_unknown_active_slot_values(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL enforces the active-slot CHECK constraint.');
        }

        $this->expectException(QueryException::class);
        Roadmap::factory()->create(['active_slot' => 2]);
    }

    public function test_version_numbers_are_unique_within_a_roadmap(): void
    {
        $roadmap = Roadmap::factory()->create();
        RoadmapVersion::factory()->for($roadmap)->create(['version_number' => 1]);

        $this->expectException(QueryException::class);
        RoadmapVersion::factory()->for($roadmap)->create(['version_number' => 1]);
    }

    public function test_stage_positions_are_unique_within_a_version(): void
    {
        $version = RoadmapVersion::factory()->create();
        Stage::factory()->for($version, 'roadmapVersion')->create(['position' => 1]);

        $this->expectException(QueryException::class);
        Stage::factory()->for($version, 'roadmapVersion')->create(['position' => 1]);
    }

    public function test_task_positions_are_unique_within_a_stage(): void
    {
        $stage = Stage::factory()->create();
        Task::factory()->for($stage)->create(['position' => 1]);

        $this->expectException(QueryException::class);
        Task::factory()->for($stage)->create(['position' => 1]);
    }

    public function test_duplicate_dependency_is_rejected(): void
    {
        [$task, $dependency] = $this->twoTasksInSameStage();
        TaskDependency::query()->create([
            'task_id' => $task->id,
            'depends_on_task_id' => $dependency->id,
        ]);

        $this->expectException(QueryException::class);
        TaskDependency::query()->create([
            'task_id' => $task->id,
            'depends_on_task_id' => $dependency->id,
        ]);
    }

    public function test_mysql_rejects_self_dependency_at_database_layer(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL enforces the self-dependency CHECK constraint.');
        }

        $task = Task::factory()->create();

        $this->expectException(QueryException::class);
        TaskDependency::query()->create([
            'task_id' => $task->id,
            'depends_on_task_id' => $task->id,
        ]);
    }

    /** @return array{Task, Task} */
    private function twoTasksInSameStage(): array
    {
        $stage = Stage::factory()->create();

        return [
            Task::factory()->for($stage)->create(['position' => 1]),
            Task::factory()->for($stage)->create(['position' => 2]),
        ];
    }
}
