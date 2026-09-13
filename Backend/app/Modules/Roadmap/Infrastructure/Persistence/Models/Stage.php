<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Infrastructure\Persistence\Models;

use App\Modules\Roadmap\Domain\Enums\StageStatus;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use Database\Factories\StageFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Stage extends Model
{
    /** @use HasFactory<StageFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'roadmap_version_id', 'title', 'description', 'position', 'status',
        'estimated_minutes', 'activated_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => StageStatus::class,
            'position' => 'integer',
            'estimated_minutes' => 'integer',
            'activated_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<RoadmapVersion, $this> */
    public function roadmapVersion(): BelongsTo
    {
        return $this->belongsTo(RoadmapVersion::class);
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position');
    }

    protected static function newFactory(): StageFactory
    {
        return StageFactory::new();
    }
}
