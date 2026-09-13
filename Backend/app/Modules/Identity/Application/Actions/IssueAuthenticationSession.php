<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Contracts\AccessTokenService;
use App\Modules\Identity\Application\Data\IssuedAuthenticationSession;
use App\Modules\Identity\Application\Data\IssuedTokenPair;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Support\Str;

final readonly class IssueAuthenticationSession
{
    public function __construct(private AccessTokenService $accessTokenService) {}

    public function execute(User $user, ?string $familyId = null): IssuedAuthenticationSession
    {
        $familyId ??= (string) Str::ulid();
        $plainRefreshToken = sodium_bin2base64(
            random_bytes(48),
            SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING,
        );
        $refreshTtlSeconds = max(1, (int) config('jwt.refresh_ttl_days')) * 86400;
        $refreshTokenRecord = $user->refreshTokens()->create([
            'id' => (string) Str::ulid(),
            'family_id' => $familyId,
            'token_hash' => hash('sha256', $plainRefreshToken),
            'expires_at' => now()->addSeconds($refreshTtlSeconds),
        ]);
        $accessToken = $this->accessTokenService->issue((string) $user->getKey(), $familyId);

        return new IssuedAuthenticationSession(
            new IssuedTokenPair($accessToken, $plainRefreshToken, $refreshTtlSeconds),
            $refreshTokenRecord,
        );
    }
}
