<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Roadmap\Infrastructure\Persistence\Models\Stage;
use App\Modules\TaskExecution\Domain\Enums\TaskStatus;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskType;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Task> */
final class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'stage_id' => Stage::factory(),
            'task_type_id' => fn (): string => TaskType::query()->firstOrCreate(
                ['code' => 'read'],
                ['name' => 'Read', 'is_active' => true],
            )->id,
            'title' => fake()->sentence(4),
            'instructions' => fake()->paragraph(),
            'position' => 1,
            'status' => TaskStatus::Upcoming,
            'is_required' => true,
        ];
    }
}
