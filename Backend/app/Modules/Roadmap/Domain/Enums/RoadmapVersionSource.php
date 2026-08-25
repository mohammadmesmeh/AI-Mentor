<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Domain\Enums;

enum RoadmapVersionSource: string
{
    case Generated = 'generated';
    case Regenerated = 'regenerated';
    case Manual = 'manual';
    case Adaptation = 'adaptation';
}
