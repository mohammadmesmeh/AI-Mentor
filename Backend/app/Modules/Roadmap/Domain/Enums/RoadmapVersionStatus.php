<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Domain\Enums;

enum RoadmapVersionStatus: string
{
    case Draft = 'draft';
    case Current = 'current';
    case Superseded = 'superseded';
    case Archived = 'archived';
}
