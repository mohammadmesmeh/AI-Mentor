<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Contracts;

use DateTimeInterface;

interface TokenRevocationStore
{
    public function isTokenRevoked(string $tokenId): bool;

    public function isFamilyRevoked(string $familyId): bool;

    public function revokeToken(string $tokenId, DateTimeInterface $until): void;

    public function revokeFamily(string $familyId, DateTimeInterface $until): void;
}
