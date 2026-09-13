<?php

declare(strict_types=1);

namespace App\Modules\TaskExecution\Domain\Enums;

enum TaskStatus: string
{
    case Upcoming = 'upcoming';
    case Available = 'available';
    case Current = 'current';
    case Completed = 'completed';
    case SkipPending = 'skip_pending';
    case Skipped = 'skipped';
    case Replaced = 'replaced';
}
