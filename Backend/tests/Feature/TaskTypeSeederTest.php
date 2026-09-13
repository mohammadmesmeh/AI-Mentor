<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TaskTypeSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_creates_supported_task_types(): void
    {
        $this->seed();

        self::assertSame(
            ['assignment', 'coding_challenge', 'project', 'quiz', 'read', 'watch'],
            TaskType::query()->orderBy('code')->pluck('code')->all(),
        );
    }
}
