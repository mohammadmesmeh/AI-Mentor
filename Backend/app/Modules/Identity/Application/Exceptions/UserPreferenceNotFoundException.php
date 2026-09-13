<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Exceptions;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class UserPreferenceNotFoundException extends NotFoundHttpException
{
    public function __construct()
    {
        parent::__construct('User preferences were not found.');
    }
}
