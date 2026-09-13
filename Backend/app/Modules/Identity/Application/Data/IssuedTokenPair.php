<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Data;

final readonly class IssuedTokenPair
{
    public function __construct(
        public IssuedAccessToken $access,
        public string $refreshToken,
        public int $refreshExpiresIn,
    ) {}
}
