<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain\Enums;

enum ResourceLanguage: string
{
    case Arabic = 'ar';
    case English = 'en';
    case Both = 'both';
}
