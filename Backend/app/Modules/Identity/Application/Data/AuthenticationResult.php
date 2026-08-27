<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Data;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;

final readonly class AuthenticationResult
{
    public function __construct(
        public User $user,
        public IssuedTokenPair $tokens,
    ) {}
}
