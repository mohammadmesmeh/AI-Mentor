<?php

declare(strict_types=1);

use App\Modules\Roadmap\Domain\Enums\RoadmapVersionSource;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roadmap_versions', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('roadmap_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('generation_request_id')
                ->nullable()
                ->constrained('roadmap_generation_requests')
                ->nullOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('source', 32)->default(RoadmapVersionSource::Generated->value);
            $table->string('status', 32)->default(RoadmapVersionStatus::Draft->value);
            $table->text('change_summary')->nullable();
            $table->timestamps();

            $table->unique(['roadmap_id', 'version_number'], 'roadmap_versions_number_unique');
            $table->index(['roadmap_id', 'status'], 'roadmap_versions_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roadmap_versions');
    }
};
