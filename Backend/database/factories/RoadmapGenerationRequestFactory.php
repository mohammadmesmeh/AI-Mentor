<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<RoadmapGenerationRequest> */
final class RoadmapGenerationRequestFactory extends Factory
{
    protected $model = RoadmapGenerationRequest::class;

    public function definition(): array
    {
        $key = Str::random(32);

        return [
            'user_id' => User::factory(),
            'correlation_id' => (string) Str::ulid(),
            'idempotency_key_hash' => hash('sha256', $key),
            'status' => GenerationRequestStatus::Queued,
            'active_slot' => 1,
            'snapshot_schema_version' => 1,
            'input_snapshot' => ['schema_version' => 1],
        ];
    }

    public function terminal(GenerationRequestStatus $status = GenerationRequestStatus::Succeeded): self
    {
        return $this->state(fn (): array => ['status' => $status, 'active_slot' => null]);
    }
}
