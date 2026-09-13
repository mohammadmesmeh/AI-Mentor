<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class RoadmapGenerationInProgressException extends ConflictHttpException
{
    public function __construct(public readonly string $generationRequestId)
    {
        parent::__construct('A roadmap generation request is already in progress.');
    }
}
