<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Infrastructure\Persistence\Models;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use Database\Factories\RoadmapFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Roadmap extends Model
{
    /** @use HasFactory<RoadmapFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'current_version_id',
        'goal_snapshot',
        'status',
        'active_slot',
        'learning_started_at',
        'activated_at',
        'completed_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => RoadmapStatus::class,
            'active_slot' => 'integer',
            'learning_started_at' => 'immutable_datetime',
            'activated_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
            'archived_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<RoadmapVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(RoadmapVersion::class);
    }

    /** @return BelongsTo<RoadmapVersion, $this> */
    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(RoadmapVersion::class, 'current_version_id');
    }

    /** @return HasMany<RoadmapGenerationRequest, $this> */
    public function generationRequests(): HasMany
    {
        return $this->hasMany(RoadmapGenerationRequest::class);
    }

    protected static function newFactory(): RoadmapFactory
    {
        return RoadmapFactory::new();
    }
}
