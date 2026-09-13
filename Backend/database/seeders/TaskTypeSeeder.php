<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskType;
use Illuminate\Database\Seeder;

final class TaskTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'read' => 'Read',
            'watch' => 'Watch',
            'quiz' => 'Quiz',
            'project' => 'Project',
            'assignment' => 'Assignment',
            'coding_challenge' => 'Coding Challenge',
        ];

        foreach ($types as $code => $name) {
            TaskType::query()->updateOrCreate(
                ['code' => $code],
                ['name' => $name, 'is_active' => true],
            );
        }
    }
}
