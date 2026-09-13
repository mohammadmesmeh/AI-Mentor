<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Application\Contracts\TokenRevocationStore;
use App\Modules\Identity\Application\Exceptions\RevocationStoreUnavailableException;
use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use DateTimeImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Hmac\Sha512;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\UnencryptedToken;
use Tests\TestCase;

final class JwtAccessTokenSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_and_malformed_authorization_headers_are_rejected(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);

        $missing = $this->getJson('/api/v1/me')->assertUnauthorized();
        self::assertSame($missing->json('meta.request_id'), $missing->headers->get('X-Request-ID'));
        self::assertTrue(Str::isUlid((string) $missing->json('meta.request_id')));
        $this->withToken($tokens->refreshToken)->getJson('/api/v1/me')->assertUnauthorized();

        foreach ([
            'Basic '.$tokens->access->token,
            'bearer '.$tokens->access->token,
            'Bearer',
            'Bearer  '.$tokens->access->token,
            'Bearer '.$tokens->access->token.',other',
            'Bearer '.$tokens->access->token.' trailing',
        ] as $authorization) {
            $this->withHeader('Authorization', $authorization)
                ->getJson('/api/v1/me')
                ->assertUnauthorized()
                ->assertJsonPath('error.code', 'unauthenticated')
                ->assertJsonStructure(['error' => ['code', 'message'], 'meta' => ['request_id']]);
        }
    }

    public function test_issued_access_token_contains_only_the_approved_claims_and_algorithm(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);
        $configuration = Configuration::forSymmetricSigner(
            new Sha256,
            InMemory::plainText($this->jwtTestSecret),
        );
        $token = $configuration->parser()->parse($tokens->access->token);

        self::assertInstanceOf(UnencryptedToken::class, $token);
        self::assertSame('HS256', $token->headers()->get('alg'));
        $claimNames = array_keys($token->claims()->all());
        sort($claimNames);
        self::assertSame(['aud', 'exp', 'iat', 'iss', 'jti', 'nbf', 'sid', 'sub'], $claimNames);
        self::assertSame($user->id, $token->claims()->get('sub'));
        self::assertSame($tokens->access->claims->familyId, $token->claims()->get('sid'));
    }

    public function test_signature_algorithm_registered_claims_and_subject_are_strictly_validated(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);
        $familyId = $tokens->access->claims->familyId;
        $now = new DateTimeImmutable;

        $invalidTokens = [
            'wrong signature' => $this->jwt($user->id, $familyId, key: random_bytes(32)),
            'wrong algorithm' => $this->jwt($user->id, $familyId, signer: new Sha512, key: random_bytes(64)),
            'wrong issuer' => $this->jwt($user->id, $familyId, issuer: 'untrusted-issuer'),
            'wrong audience' => $this->jwt($user->id, $familyId, audience: 'untrusted-audience'),
            'expired' => $this->jwt(
                $user->id,
                $familyId,
                issuedAt: $now->modify('-20 minutes'),
                notBefore: $now->modify('-20 minutes'),
                expiresAt: $now->modify('-10 minutes'),
            ),
            'future nbf' => $this->jwt(
                $user->id,
                $familyId,
                issuedAt: $now,
                notBefore: $now->modify('+10 minutes'),
                expiresAt: $now->modify('+20 minutes'),
            ),
            'invalid subject' => $this->jwt('not-a-ulid', $familyId),
            'unknown subject' => $this->jwt((string) Str::ulid(), $familyId),
            'invalid token id' => $this->jwt($user->id, $familyId, tokenId: 'not-a-ulid'),
            'invalid session id' => $this->jwt($user->id, 'not-a-ulid'),
        ];

        foreach ($invalidTokens as $token) {
            $this->withToken($token)->getJson('/api/v1/me')
                ->assertUnauthorized()
                ->assertJsonPath('error.code', 'unauthenticated');
        }
    }

    public function test_revoked_token_and_family_are_rejected_immediately(): void
    {
        $user = User::factory()->create();
        $first = $this->issueTokenPair($user);
        $second = $this->issueTokenPair($user);
        $store = $this->app->make(TokenRevocationStore::class);

        $store->revokeToken($first->access->claims->tokenId, $first->access->claims->expiresAt);
        $store->revokeFamily(
            $second->access->claims->familyId,
            now()->addDays((int) config('jwt.refresh_ttl_days')),
        );

        $this->withToken($first->access->token)->getJson('/api/v1/me')->assertUnauthorized();
        $this->withToken($second->access->token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_access_requires_an_active_database_session_and_active_account(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);

        $user->refreshTokens()->update(['revoked_at' => now()]);
        $this->withToken($tokens->access->token)->getJson('/api/v1/me')->assertUnauthorized();

        $suspended = User::factory()->create(['status' => UserStatus::Suspended]);
        $suspendedTokens = $this->issueTokenPair($suspended);
        $this->withToken($suspendedTokens->access->token)->getJson('/api/v1/me')->assertUnauthorized();

        $deleting = User::factory()->create([
            'status' => UserStatus::DeletionRequested,
            'deletion_requested_at' => now(),
        ]);
        $deletingTokens = $this->issueTokenPair($deleting);
        $this->withToken($deletingTokens->access->token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_revocation_store_failure_fails_closed_with_a_service_error(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);
        $store = $this->mock(TokenRevocationStore::class);
        $store->shouldReceive('isTokenRevoked')->once()->andThrow(new RevocationStoreUnavailableException);

        $this->withToken($tokens->access->token)->getJson('/api/v1/me')
            ->assertServiceUnavailable()
            ->assertJsonPath('error.code', 'authentication_service_unavailable')
            ->assertJsonPath('error.message', 'An unexpected error occurred.')
            ->assertJsonStructure(['meta' => ['request_id']]);
    }

    private function jwt(
        string $userId,
        string $familyId,
        ?string $tokenId = null,
        ?string $issuer = null,
        ?string $audience = null,
        ?DateTimeImmutable $issuedAt = null,
        ?DateTimeImmutable $notBefore = null,
        ?DateTimeImmutable $expiresAt = null,
        ?Signer $signer = null,
        ?string $key = null,
    ): string {
        $now = new DateTimeImmutable;
        $signer ??= new Sha256;
        $key ??= $this->jwtTestSecret;
        $configuration = Configuration::forSymmetricSigner($signer, InMemory::plainText($key));
        $token = $configuration->builder()
            ->issuedBy($issuer ?? (string) config('jwt.issuer'))
            ->permittedFor($audience ?? (string) config('jwt.audience'))
            ->relatedTo($userId)
            ->identifiedBy($tokenId ?? (string) Str::ulid())
            ->issuedAt($issuedAt ?? $now)
            ->canOnlyBeUsedAfter($notBefore ?? $now)
            ->expiresAt($expiresAt ?? $now->modify('+15 minutes'))
            ->withClaim('sid', $familyId)
            ->getToken($configuration->signer(), $configuration->signingKey());

        return $token->toString();
    }
}
