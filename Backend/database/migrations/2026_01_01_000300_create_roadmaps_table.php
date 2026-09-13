<?php

declare(strict_types=1);

use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roadmaps', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->restrictOnDelete();
            $table->text('goal_snapshot');
            $table->string('status', 32)->default(RoadmapStatus::Draft->value);
            $table->unsignedTinyInteger('active_slot')->nullable();
            $table->timestamp('learning_started_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'active_slot'], 'roadmaps_one_active_per_user');
            $table->index(['user_id', 'status'], 'roadmaps_user_status_index');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement(
                'ALTER TABLE roadmaps ADD CONSTRAINT roadmaps_active_slot_value CHECK (active_slot IS NULL OR active_slot = 1)',
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('roadmaps');
    }
};
