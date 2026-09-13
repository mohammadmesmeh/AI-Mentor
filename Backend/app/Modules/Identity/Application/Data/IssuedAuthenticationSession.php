<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Data;

use App\Modules\Identity\Infrastructure\Persistence\Models\RefreshToken;

final readonly class IssuedAuthenticationSession
{
    public function __construct(
        public IssuedTokenPair $tokens,
        public RefreshToken $refreshTokenRecord,
    ) {}
}
