<?php

declare(strict_types=1);

namespace App\Modules\Identity\Domain\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case DeletionRequested = 'deletion_requested';
}
