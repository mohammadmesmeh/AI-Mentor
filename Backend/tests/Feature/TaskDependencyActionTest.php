<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Roadmap\Infrastructure\Persistence\Models\Stage;
use App\Modules\TaskExecution\Application\Actions\CreateTaskDependency;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TaskDependencyActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_layer_rejects_self_dependency(): void
    {
        $task = Task::factory()->create();

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('A task cannot depend on itself.');

        $this->app->make(CreateTaskDependency::class)->execute($task->id, $task->id);
    }

    public function test_application_layer_creates_valid_dependency(): void
    {
        $stage = Stage::factory()->create();
        $task = Task::factory()->for($stage)->create(['position' => 1]);
        $dependency = Task::factory()->for($stage)->create(['position' => 2]);

        $record = $this->app->make(CreateTaskDependency::class)
            ->execute($task->id, $dependency->id);

        self::assertTrue($record->task->is($task));
        self::assertTrue($record->dependency->is($dependency));
    }

    public function test_application_layer_rejects_cross_roadmap_dependencies(): void
    {
        $task = Task::factory()->create();
        $dependency = Task::factory()->create();

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('same roadmap version');

        $this->app->make(CreateTaskDependency::class)
            ->execute($task->id, $dependency->id);
    }

    public function test_application_layer_rejects_a_dependency_cycle(): void
    {
        $stage = Stage::factory()->create();
        $first = Task::factory()->for($stage)->create(['position' => 1]);
        $second = Task::factory()->for($stage)->create(['position' => 2]);
        $action = $this->app->make(CreateTaskDependency::class);
        $action->execute($first->id, $second->id);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('cycle');

        $action->execute($second->id, $first->id);
    }
}
