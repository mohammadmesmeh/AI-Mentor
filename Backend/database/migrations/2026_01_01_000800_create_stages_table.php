<?php

declare(strict_types=1);

use App\Modules\Roadmap\Domain\Enums\StageStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stages', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('roadmap_version_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('position');
            $table->string('status', 32)->default(StageStatus::Upcoming->value);
            $table->unsignedInteger('estimated_minutes')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['roadmap_version_id', 'position'], 'stages_version_position_unique');
            $table->index(['roadmap_version_id', 'status'], 'stages_version_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stages');
    }
};
