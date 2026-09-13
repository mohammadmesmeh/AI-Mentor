<?php

declare(strict_types=1);

use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roadmap_generation_requests', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('roadmap_id')->nullable()->constrained()->nullOnDelete();
            $table->ulid('correlation_id')->unique();
            $table->string('idempotency_key', 128)->nullable();
            $table->string('status', 32)->default(GenerationRequestStatus::Queued->value);
            $table->json('input_snapshot');
            $table->json('validated_output')->nullable();
            $table->string('provider')->nullable();
            $table->string('model')->nullable();
            $table->string('prompt_version')->nullable();
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->string('failure_code')->nullable();
            $table->text('failure_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status'], 'generation_requests_user_status_index');
            $table->index('idempotency_key', 'generation_requests_idempotency_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roadmap_generation_requests');
    }
};
