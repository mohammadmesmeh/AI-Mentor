<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Data\AuthenticationResult;
use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final readonly class RegisterUser
{
    public function __construct(private IssueAuthenticationSession $issueAuthenticationSession) {}

    /** @param array{name: string, email: string, password: string} $attributes */
    public function execute(array $attributes): AuthenticationResult
    {
        return DB::transaction(function () use ($attributes): AuthenticationResult {
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

            $user = $user->refresh();
            $session = $this->issueAuthenticationSession->execute($user);

            return new AuthenticationResult($user, $session->tokens);
        });
    }
}
