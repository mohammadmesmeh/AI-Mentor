<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Contracts\TokenRevocationStore;
use App\Modules\Identity\Application\Data\AccessTokenClaims;
use App\Modules\Identity\Application\Exceptions\InvalidRefreshTokenException;
use App\Modules\Identity\Infrastructure\Persistence\Models\RefreshToken;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final readonly class LogoutUser
{
    public function __construct(private TokenRevocationStore $revocationStore) {}

    public function execute(AccessTokenClaims $claims, string $plainRefreshToken): void
    {
        /** @var CarbonImmutable|null $familyExpiresAt */
        $familyExpiresAt = DB::transaction(function () use ($claims, $plainRefreshToken): ?CarbonImmutable {
            $token = RefreshToken::query()
                ->where('token_hash', hash('sha256', $plainRefreshToken))
                ->lockForUpdate()
                ->first();
            $expiresAt = $token?->getAttribute('expires_at');

            if ($token === null
                || $token->user_id !== $claims->userId
                || $token->family_id !== $claims->familyId
                || $token->revoked_at !== null
                || ! $expiresAt instanceof CarbonImmutable
                || $expiresAt->isPast()) {
                return null;
            }

            $maximumExpiry = RefreshToken::query()->where('family_id', $claims->familyId)->max('expires_at');
            RefreshToken::query()
                ->where('family_id', $claims->familyId)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            return CarbonImmutable::parse($maximumExpiry ?? $expiresAt);
        }, 3);

        if ($familyExpiresAt === null) {
            throw new InvalidRefreshTokenException;
        }

        $this->revocationStore->revokeToken($claims->tokenId, $claims->expiresAt);
        $this->revocationStore->revokeFamily($claims->familyId, $familyExpiresAt);
    }
}
