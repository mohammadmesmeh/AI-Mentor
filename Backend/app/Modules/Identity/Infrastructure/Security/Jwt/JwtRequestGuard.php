<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Security\Jwt;

use Illuminate\Auth\RequestGuard;
use Illuminate\Http\Request;

final class JwtRequestGuard extends RequestGuard
{
    public function setRequest(Request $request): static
    {
        $this->user = null;

        return parent::setRequest($request);
    }
}
