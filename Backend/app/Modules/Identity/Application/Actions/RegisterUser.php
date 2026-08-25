<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class RegisterUser
{
    /** @param array{name: string, email: string, password: string} $attributes */
    public function execute(array $attributes): User
    {
        return DB::transaction(static function () use ($attributes): User {
            $user = User::query()->create([
                'name' => $attributes['name'],
                'email' => $attributes['email'],
                'password' => Hash::make($attributes['password']),
            ]);

            $user->preference()->create([
                'ui_locale' => UiLocale::English,
                'resource_language' => ResourceLanguage::Both,
                'timezone' => 'UTC',
            ]);

            return $user->refresh();
        });
    }
}
