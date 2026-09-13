<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_resources', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->string('title');
            $table->string('url', 2048);
            $table->string('type', 32);
            $table->unsignedInteger('position');
            $table->timestamps();

            $table->unique(['task_id', 'position'], 'task_resources_task_position_unique');
            $table->index(['task_id', 'type'], 'task_resources_task_type_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_resources');
    }
};
