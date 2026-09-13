<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Exceptions;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class RoadmapGenerationRequestNotFoundException extends NotFoundHttpException
{
    public function __construct()
    {
        parent::__construct('Roadmap generation request was not found.');
    }
}
