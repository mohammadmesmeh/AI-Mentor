<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Security;

use App\Modules\Identity\Application\Contracts\TokenRevocationStore;
use App\Modules\Identity\Application\Exceptions\RevocationStoreUnavailableException;
use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Support\Facades\Redis;
use Throwable;

final class RedisTokenRevocationStore implements TokenRevocationStore
{
    public function isTokenRevoked(string $tokenId): bool
    {
        return $this->exists($this->key('jti', $tokenId));
    }

    public function isFamilyRevoked(string $familyId): bool
    {
        return $this->exists($this->key('sid', $familyId));
    }

    public function revokeToken(string $tokenId, DateTimeInterface $until): void
    {
        $this->store($this->key('jti', $tokenId), $until);
    }

    public function revokeFamily(string $familyId, DateTimeInterface $until): void
    {
        $this->store($this->key('sid', $familyId), $until);
    }

    private function exists(string $key): bool
    {
        try {
            return (bool) Redis::connection()->exists($key);
        } catch (Throwable $exception) {
            throw new RevocationStoreUnavailableException(previous: $exception);
        }
    }

    private function store(string $key, DateTimeInterface $until): void
    {
        $ttl = max(1, $until->getTimestamp() - (new DateTimeImmutable)->getTimestamp());

        try {
            Redis::connection()->setex($key, $ttl, '1');
        } catch (Throwable $exception) {
            throw new RevocationStoreUnavailableException(previous: $exception);
        }
    }

    private function key(string $type, string $identifier): string
    {
        return (string) config('jwt.redis_prefix').':'.$type.':'.$identifier;
    }
}
