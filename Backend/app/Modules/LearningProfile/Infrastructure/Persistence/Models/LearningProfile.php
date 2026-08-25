<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Infrastructure\Persistence\Models;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Domain\Enums\SelfAssessedLevel;
use Database\Factories\LearningProfileFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LearningProfile extends Model
{
    /** @use HasFactory<LearningProfileFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'user_id',
        'goal',
        'self_assessed_level',
        'desired_outcome',
        'available_minutes_per_week',
        'preferred_learning_methods',
        'onboarding_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'self_assessed_level' => SelfAssessedLevel::class,
            'preferred_learning_methods' => 'array',
            'onboarding_completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function newFactory(): LearningProfileFactory
    {
        return LearningProfileFactory::new();
    }
}
