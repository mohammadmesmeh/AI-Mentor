<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Domain\Enums;

enum SelfAssessedLevel: string
{
    case CompleteBeginner = 'complete_beginner';
    case SomeExperience = 'some_experience';
    case Intermediate = 'intermediate';
}
