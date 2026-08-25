<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_dependencies', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignUlid('depends_on_task_id')->constrained('tasks')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(
                ['task_id', 'depends_on_task_id'],
                'task_dependencies_pair_unique',
            );
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE task_dependencies ADD CONSTRAINT task_dependencies_no_self CHECK (task_id <> depends_on_task_id)',
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
    }
};
