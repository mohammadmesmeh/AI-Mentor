<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Persistence\Models;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use Database\Factories\UserPreferenceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class UserPreference extends Model
{
    /** @use HasFactory<UserPreferenceFactory> */
    use HasFactory, HasUlids;

    protected $fillable = ['user_id', 'ui_locale', 'resource_language', 'timezone'];

    protected function casts(): array
    {
        return [
            'ui_locale' => UiLocale::class,
            'resource_language' => ResourceLanguage::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function newFactory(): UserPreferenceFactory
    {
        return UserPreferenceFactory::new();
    }
}
