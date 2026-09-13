<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Contracts\TokenRevocationStore;
use App\Modules\Identity\Application\Data\AuthenticationResult;
use App\Modules\Identity\Application\Exceptions\InvalidRefreshTokenException;
use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\RefreshToken;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final readonly class RefreshAuthentication
{
    public function __construct(
        private IssueAuthenticationSession $issueAuthenticationSession,
        private TokenRevocationStore $revocationStore,
    ) {}

    public function execute(string $plainRefreshToken): AuthenticationResult
    {
        /** @var array{result: ?AuthenticationResult, revoked_family: ?string, revoke_until: ?CarbonImmutable} $outcome */
        $outcome = DB::transaction(function () use ($plainRefreshToken): array {
            $token = RefreshToken::query()
                ->where('token_hash', hash('sha256', $plainRefreshToken))
                ->lockForUpdate()
                ->first();

            if ($token === null) {
                return ['result' => null, 'revoked_family' => null, 'revoke_until' => null];
            }

            if ($token->revoked_at !== null) {
                if ($token->replaced_by_id === null) {
                    return ['result' => null, 'revoked_family' => null, 'revoke_until' => null];
                }

                $revokeUntil = $this->revokeFamilyInDatabase($token->family_id);

                return ['result' => null, 'revoked_family' => $token->family_id, 'revoke_until' => $revokeUntil];
            }

            $expiresAt = $token->getAttribute('expires_at');

            if (! $expiresAt instanceof CarbonImmutable || $expiresAt->isPast()) {
                $token->forceFill(['revoked_at' => now()])->save();

                return ['result' => null, 'revoked_family' => null, 'revoke_until' => null];
            }

            $user = $token->user()->lockForUpdate()->first();
            $status = $user?->getAttribute('status');
            $deletionRequestedAt = $user?->getAttribute('deletion_requested_at');

            if (! $user instanceof User
                || ! $status instanceof UserStatus
                || $status !== UserStatus::Active
                || $deletionRequestedAt !== null) {
                $revokeUntil = $this->revokeFamilyInDatabase($token->family_id);

                return ['result' => null, 'revoked_family' => $token->family_id, 'revoke_until' => $revokeUntil];
            }

            $replacement = $this->issueAuthenticationSession->execute($user, $token->family_id);
            $token->forceFill([
                'last_used_at' => now(),
                'revoked_at' => now(),
                'replaced_by_id' => $replacement->refreshTokenRecord->getKey(),
            ])->save();

            return [
                'result' => new AuthenticationResult($user, $replacement->tokens),
                'revoked_family' => null,
                'revoke_until' => null,
            ];
        }, 3);

        if ($outcome['revoked_family'] !== null && $outcome['revoke_until'] !== null) {
            $this->revocationStore->revokeFamily($outcome['revoked_family'], $outcome['revoke_until']);
        }

        if ($outcome['result'] === null) {
            throw new InvalidRefreshTokenException;
        }

        return $outcome['result'];
    }

    private function revokeFamilyInDatabase(string $familyId): CarbonImmutable
    {
        $maximumExpiry = RefreshToken::query()->where('family_id', $familyId)->max('expires_at');
        RefreshToken::query()->where('family_id', $familyId)->whereNull('revoked_at')->update(['revoked_at' => now()]);

        return CarbonImmutable::parse($maximumExpiry ?? now());
    }
}
