<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Exceptions;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Throwable;

final class RevocationStoreUnavailableException extends ServiceUnavailableHttpException
{
    public function __construct(?Throwable $previous = null)
    {
        parent::__construct(null, 'Authentication revocation service is unavailable.', $previous);
    }
}
