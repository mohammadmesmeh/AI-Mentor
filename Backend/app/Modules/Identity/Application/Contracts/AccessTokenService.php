<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Contracts;

use App\Modules\Identity\Application\Data\AccessTokenClaims;
use App\Modules\Identity\Application\Data\IssuedAccessToken;

interface AccessTokenService
{
    public function issue(string $userId, string $familyId): IssuedAccessToken;

    public function verify(string $token): AccessTokenClaims;
}
