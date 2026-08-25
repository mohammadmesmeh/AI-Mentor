<?php

declare(strict_types=1);

namespace App\Modules\TaskExecution\Infrastructure\Persistence\Models;

use App\Modules\Roadmap\Infrastructure\Persistence\Models\Stage;
use App\Modules\TaskExecution\Domain\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'stage_id', 'task_type_id', 'title', 'instructions', 'position', 'status',
        'is_required', 'estimated_minutes', 'completed_at', 'skipped_at', 'replaced_by_task_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'position' => 'integer',
            'is_required' => 'boolean',
            'estimated_minutes' => 'integer',
            'completed_at' => 'immutable_datetime',
            'skipped_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Stage, $this> */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    /** @return BelongsTo<TaskType, $this> */
    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    /** @return BelongsTo<Task, $this> */
    public function replacement(): BelongsTo
    {
        return $this->belongsTo(self::class, 'replaced_by_task_id');
    }

    /** @return HasMany<TaskDependency, $this> */
    public function dependencyRecords(): HasMany
    {
        return $this->hasMany(TaskDependency::class);
    }

    /** @return BelongsToMany<Task, $this> */
    public function dependencies(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'task_dependencies',
            'task_id',
            'depends_on_task_id',
        )->withTimestamps();
    }

    protected static function newFactory(): TaskFactory
    {
        return TaskFactory::new();
    }
}
