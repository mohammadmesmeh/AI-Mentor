<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Security\Jwt;

use App\Modules\Identity\Application\Contracts\AccessTokenService;
use App\Modules\Identity\Application\Data\AccessTokenClaims;
use App\Modules\Identity\Application\Data\IssuedAccessToken;
use App\Modules\Identity\Application\Exceptions\InvalidAccessTokenException;
use DateInterval;
use DateTimeImmutable;
use Illuminate\Support\Str;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\UnencryptedToken;
use Lcobucci\JWT\Validation\Constraint\IssuedBy;
use Lcobucci\JWT\Validation\Constraint\PermittedFor;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\StrictValidAt;
use Throwable;

final class LcobucciAccessTokenService implements AccessTokenService
{
    private readonly Configuration $configuration;

    private readonly string $issuer;

    private readonly string $audience;

    private readonly int $ttlSeconds;

    private readonly StrictValidAt $strictValidAt;

    public function __construct(SystemClock $clock)
    {
        $secret = config('jwt.secret');
        $decodedSecret = is_string($secret) ? base64_decode($secret, true) : false;

        if ($decodedSecret === false || strlen($decodedSecret) < 32) {
            if (! app()->runningUnitTests() && ! defined('PHPUNIT_COMPOSER_INSTALL')) {
                throw new \RuntimeException('JWT_SECRET must be valid Base64 containing at least 32 random bytes.');
            }

            $decodedSecret = str_repeat('T', 32);
        }

        $this->issuer = (string) config('jwt.issuer');
        $this->audience = (string) config('jwt.audience');
        $this->ttlSeconds = max(1, (int) config('jwt.access_ttl_minutes')) * 60;
        $clockSkew = max(0, (int) config('jwt.clock_skew_seconds'));
        $this->configuration = Configuration::forSymmetricSigner(
            new Sha256,
            InMemory::plainText($decodedSecret),
        );
        $this->strictValidAt = new StrictValidAt($clock, new DateInterval("PT{$clockSkew}S"));
    }

    public function issue(string $userId, string $familyId): IssuedAccessToken
    {
        $issuedAt = new DateTimeImmutable('now');
        $expiresAt = $issuedAt->modify("+{$this->ttlSeconds} seconds");
        $tokenId = (string) Str::ulid();
        $token = $this->configuration->builder()
            ->issuedBy($this->issuer)
            ->permittedFor($this->audience)
            ->relatedTo($userId)
            ->identifiedBy($tokenId)
            ->issuedAt($issuedAt)
            ->canOnlyBeUsedAfter($issuedAt)
            ->expiresAt($expiresAt)
            ->withClaim('sid', $familyId)
            ->getToken($this->configuration->signer(), $this->configuration->signingKey());

        return new IssuedAccessToken(
            $token->toString(),
            $this->ttlSeconds,
            new AccessTokenClaims($userId, $tokenId, $familyId, $issuedAt, $expiresAt),
        );
    }

    public function verify(string $token): AccessTokenClaims
    {
        try {
            $parsed = $this->configuration->parser()->parse($token);

            if (! $parsed instanceof UnencryptedToken) {
                throw new InvalidAccessTokenException;
            }

            $this->configuration->validator()->assert(
                $parsed,
                new SignedWith($this->configuration->signer(), $this->configuration->verificationKey()),
            );

            if ($parsed->headers()->get('alg') !== $this->configuration->signer()->algorithmId()) {
                throw new InvalidAccessTokenException;
            }

            $this->configuration->validator()->assert(
                $parsed,
                new IssuedBy($this->issuer),
                new PermittedFor($this->audience),
                $this->strictValidAt,
            );

            $userId = $parsed->claims()->get('sub');
            $tokenId = $parsed->claims()->get('jti');
            $familyId = $parsed->claims()->get('sid');
            $issuedAt = $parsed->claims()->get('iat');
            $expiresAt = $parsed->claims()->get('exp');

            if (! is_string($userId) || ! Str::isUlid($userId)
                || ! is_string($tokenId) || ! Str::isUlid($tokenId)
                || ! is_string($familyId) || ! Str::isUlid($familyId)
                || ! $issuedAt instanceof DateTimeImmutable
                || ! $expiresAt instanceof DateTimeImmutable) {
                throw new InvalidAccessTokenException;
            }

            return new AccessTokenClaims($userId, $tokenId, $familyId, $issuedAt, $expiresAt);
        } catch (InvalidAccessTokenException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw new InvalidAccessTokenException(previous: $exception);
        }
    }
}
