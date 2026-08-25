<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Domain\Enums;

enum GenerationRequestStatus: string
{
    case Queued = 'queued';
    case Running = 'running';
    case Validating = 'validating';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
}
