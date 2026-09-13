<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Data;

use DateTimeImmutable;

final readonly class AccessTokenClaims
{
    public function __construct(
        public string $userId,
        public string $tokenId,
        public string $familyId,
        public DateTimeImmutable $issuedAt,
        public DateTimeImmutable $expiresAt,
    ) {}
}
