<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Application\Exceptions;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class LearningProfileNotFoundException extends NotFoundHttpException
{
    public function __construct()
    {
        parent::__construct('Learning profile was not found.');
    }
}
