<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Infrastructure\Persistence\Models;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use Database\Factories\RoadmapGenerationRequestFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class RoadmapGenerationRequest extends Model
{
    /** @use HasFactory<RoadmapGenerationRequestFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id', 'roadmap_id', 'correlation_id',
        'idempotency_key_hash', 'snapshot_schema_version', 'active_slot', 'status',
        'input_snapshot', 'validated_output', 'provider', 'model', 'prompt_version',
        'input_tokens', 'output_tokens', 'latency_ms', 'failure_code',
        'failure_message', 'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => GenerationRequestStatus::class,
            'input_snapshot' => 'array',
            'validated_output' => 'array',
            'snapshot_schema_version' => 'integer',
            'active_slot' => 'integer',
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Roadmap, $this> */
    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }

    /** @return HasMany<RoadmapVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(RoadmapVersion::class, 'generation_request_id');
    }

    public function isActive(): bool
    {
        $status = $this->getAttribute('status');

        return $status instanceof GenerationRequestStatus && $status->isActive();
    }

    /** @param array<string, mixed> $attributes */
    public function transitionTo(GenerationRequestStatus $next, array $attributes = []): void
    {
        $current = $this->getAttribute('status');

        if (! $current instanceof GenerationRequestStatus || ! $current->canTransitionTo($next)) {
            throw new \LogicException('Invalid roadmap generation request status transition.');
        }

        $this->forceFill([
            ...$attributes,
            'status' => $next,
            'active_slot' => $next->isActive() ? 1 : null,
        ])->save();
    }

    protected static function booted(): void
    {
        self::updating(function (self $request): void {
            foreach (['user_id', 'idempotency_key', 'idempotency_key_hash', 'snapshot_schema_version', 'input_snapshot'] as $field) {
                if ($request->isDirty($field)) {
                    throw new \LogicException("Generation request {$field} is immutable.");
                }
            }
        });
    }

    protected static function newFactory(): RoadmapGenerationRequestFactory
    {
        return RoadmapGenerationRequestFactory::new();
    }
}
