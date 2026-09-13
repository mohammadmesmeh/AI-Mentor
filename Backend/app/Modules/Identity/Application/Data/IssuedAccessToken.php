<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Data;

final readonly class IssuedAccessToken
{
    public function __construct(
        public string $token,
        public int $expiresIn,
        public AccessTokenClaims $claims,
    ) {}
}
