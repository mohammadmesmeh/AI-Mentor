<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Contracts\AccessTokenService;
use App\Modules\Identity\Application\Contracts\TokenRevocationStore;
use App\Modules\Identity\Application\Data\AccessTokenClaims;
use App\Modules\Identity\Application\Exceptions\InvalidAccessTokenException;
use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\RefreshToken;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final readonly class AuthenticateAccessToken
{
    public const CLAIMS_ATTRIBUTE = 'authenticated_access_token';

    public function __construct(
        private AccessTokenService $accessTokenService,
        private TokenRevocationStore $revocationStore,
    ) {}

    public function execute(Request $request): ?User
    {
        $authorization = $request->header('Authorization');

        if (! is_string($authorization) || preg_match('/\ABearer [^\s,]+\z/', $authorization) !== 1) {
            return null;
        }

        try {
            $claims = $this->accessTokenService->verify(substr($authorization, 7));
        } catch (InvalidAccessTokenException) {
            return null;
        }

        if ($this->revocationStore->isTokenRevoked($claims->tokenId)
            || $this->revocationStore->isFamilyRevoked($claims->familyId)) {
            return null;
        }

        if (! RefreshToken::query()
            ->where('family_id', $claims->familyId)
            ->where('user_id', $claims->userId)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->exists()) {
            return null;
        }

        $user = User::query()->find($claims->userId);
        $status = $user?->getAttribute('status');
        $deletionRequestedAt = $user?->getAttribute('deletion_requested_at');

        if (! $user instanceof User
            || ! $status instanceof UserStatus
            || $status !== UserStatus::Active
            || $deletionRequestedAt !== null) {
            return null;
        }

        $request->attributes->set(self::CLAIMS_ATTRIBUTE, $claims);

        return $user;
    }

    /** @throws AuthenticationException */
    public static function claims(Request $request): AccessTokenClaims
    {
        $claims = $request->attributes->get(self::CLAIMS_ATTRIBUTE);

        if (! $claims instanceof AccessTokenClaims) {
            throw new AuthenticationException;
        }

        return $claims;
    }
}
