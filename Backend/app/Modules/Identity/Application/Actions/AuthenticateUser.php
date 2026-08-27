<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Data\AuthenticationResult;
use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final readonly class AuthenticateUser
{
    public function __construct(private IssueAuthenticationSession $issueAuthenticationSession) {}

    /** @throws ValidationException */
    public function execute(string $email, string $password): AuthenticationResult
    {
        $user = User::query()->where('email', $email)->first();
        $passwordHash = $user?->getAuthPassword()
            ?? '$2y$12$K4lM3AnU94mC6B1lGk9NeuoZrF8k3O3JzS5pLJjngLGxmZ7gVwN6W';
        $passwordIsValid = Hash::check($password, $passwordHash);
        $status = $user?->getAttribute('status');
        $deletionRequestedAt = $user?->getAttribute('deletion_requested_at');

        if (! $passwordIsValid
            || ! $user instanceof User
            || ! $status instanceof UserStatus
            || $status !== UserStatus::Active
            || $deletionRequestedAt !== null) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return DB::transaction(function () use ($user): AuthenticationResult {
            $user->forceFill(['last_login_at' => now()])->save();
            $user = $user->refresh();
            $session = $this->issueAuthenticationSession->execute($user);

            return new AuthenticationResult($user, $session->tokens);
        });
    }
}
