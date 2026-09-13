<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class OnboardingIncompleteException extends ConflictHttpException
{
    /** @param list<string> $missingFields */
    public function __construct(public readonly array $missingFields)
    {
        parent::__construct('Complete onboarding before requesting roadmap generation.');
    }
}
