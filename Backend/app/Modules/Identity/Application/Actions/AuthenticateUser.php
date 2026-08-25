<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final class AuthenticateUser
{
    /** @throws ValidationException */
    public function execute(string $email, string $password): User
    {
        $guard = Auth::guard('web');

        if (! $guard->attempt([
            'email' => $email,
            'password' => $password,
            'status' => UserStatus::Active->value,
        ])) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = $guard->user();

        if (! $user instanceof User) {
            $guard->logout();

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $user->refresh();
    }
}
