<?php

declare(strict_types=1);

use App\Modules\TaskExecution\Domain\Enums\TaskStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('stage_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('task_type_id')->constrained()->restrictOnDelete();
            $table->string('title');
            $table->text('instructions');
            $table->unsignedInteger('position');
            $table->string('status', 32)->default(TaskStatus::Upcoming->value);
            $table->boolean('is_required')->default(true);
            $table->unsignedInteger('estimated_minutes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('skipped_at')->nullable();
            $table->foreignUlid('replaced_by_task_id')
                ->nullable()
                ->constrained('tasks')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['stage_id', 'position'], 'tasks_stage_position_unique');
            $table->index(['stage_id', 'status'], 'tasks_stage_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
