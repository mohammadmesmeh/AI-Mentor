<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Domain\Enums;

enum RoadmapStatus: string
{
    case Draft = 'draft';
    case Generating = 'generating';
    case Validating = 'validating';
    case Ready = 'ready';
    case Active = 'active';
    case Completed = 'completed';
    case Failed = 'failed';
    case Reset = 'reset';
    case Archived = 'archived';
}
