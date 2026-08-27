<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Exceptions;

use Illuminate\Auth\AuthenticationException;

final class InvalidRefreshTokenException extends AuthenticationException
{
    public function __construct()
    {
        parent::__construct('Invalid authentication token.');
    }
}
