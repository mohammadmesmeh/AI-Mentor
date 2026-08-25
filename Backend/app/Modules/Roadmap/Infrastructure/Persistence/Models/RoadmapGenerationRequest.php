<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Infrastructure\Persistence\Models;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class RoadmapGenerationRequest extends Model
{
    use HasUlids;

    protected $fillable = [
        'user_id', 'roadmap_id', 'correlation_id', 'idempotency_key', 'status',
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
}
