<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Domain\Enums;

enum StageStatus: string
{
    case Upcoming = 'upcoming';
    case Active = 'active';
    case Completed = 'completed';
}
