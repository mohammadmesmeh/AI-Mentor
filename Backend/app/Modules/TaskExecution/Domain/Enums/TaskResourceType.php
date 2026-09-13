<?php

declare(strict_types=1);

namespace App\Modules\TaskExecution\Domain\Enums;

enum TaskResourceType: string
{
    case Documentation = 'documentation';
    case Article = 'article';
    case Video = 'video';
    case Course = 'course';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
