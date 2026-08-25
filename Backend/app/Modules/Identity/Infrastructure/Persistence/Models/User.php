<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Persistence\Models;

use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

final class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUlids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'email_verified_at',
        'last_login_at',
        'deletion_requested_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'status' => UserStatus::class,
            'email_verified_at' => 'immutable_datetime',
            'last_login_at' => 'immutable_datetime',
            'deletion_requested_at' => 'immutable_datetime',
            'password' => 'hashed',
        ];
    }

    /** @return HasOne<UserPreference, $this> */
    public function preference(): HasOne
    {
        return $this->hasOne(UserPreference::class);
    }

    /** @return HasOne<LearningProfile, $this> */
    public function learningProfile(): HasOne
    {
        return $this->hasOne(LearningProfile::class);
    }

    /** @return HasMany<Roadmap, $this> */
    public function roadmaps(): HasMany
    {
        return $this->hasMany(Roadmap::class);
    }

    /** @return HasMany<RoadmapGenerationRequest, $this> */
    public function roadmapGenerationRequests(): HasMany
    {
        return $this->hasMany(RoadmapGenerationRequest::class);
    }

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }
}
