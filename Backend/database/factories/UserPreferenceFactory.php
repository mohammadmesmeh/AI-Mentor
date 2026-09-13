<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<UserPreference> */
final class UserPreferenceFactory extends Factory
{
    protected $model = UserPreference::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'ui_locale' => UiLocale::English,
            'resource_language' => ResourceLanguage::Both,
            'timezone' => 'UTC',
        ];
    }
}
