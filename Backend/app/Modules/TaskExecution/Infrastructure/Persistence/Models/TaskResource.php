<?php

declare(strict_types=1);

namespace App\Modules\TaskExecution\Infrastructure\Persistence\Models;

use App\Modules\TaskExecution\Domain\Enums\TaskResourceType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TaskResource extends Model
{
    use HasUlids;

    protected $fillable = ['task_id', 'title', 'url', 'type', 'position'];

    protected function casts(): array
    {
        return [
            'type' => TaskResourceType::class,
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
