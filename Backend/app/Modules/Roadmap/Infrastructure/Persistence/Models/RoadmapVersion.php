<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Infrastructure\Persistence\Models;

use App\Modules\Roadmap\Domain\Enums\RoadmapVersionSource;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use Database\Factories\RoadmapVersionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class RoadmapVersion extends Model
{
    /** @use HasFactory<RoadmapVersionFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'roadmap_id', 'generation_request_id', 'version_number', 'source', 'status', 'change_summary',
    ];

    protected function casts(): array
    {
        return [
            'source' => RoadmapVersionSource::class,
            'status' => RoadmapVersionStatus::class,
            'version_number' => 'integer',
        ];
    }

    /** @return BelongsTo<Roadmap, $this> */
    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }

    /** @return BelongsTo<RoadmapGenerationRequest, $this> */
    public function generationRequest(): BelongsTo
    {
        return $this->belongsTo(RoadmapGenerationRequest::class, 'generation_request_id');
    }

    /** @return HasMany<Stage, $this> */
    public function stages(): HasMany
    {
        return $this->hasMany(Stage::class)->orderBy('position');
    }

    protected static function newFactory(): RoadmapVersionFactory
    {
        return RoadmapVersionFactory::new();
    }
}
