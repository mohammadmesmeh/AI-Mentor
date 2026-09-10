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

    public function isActive(): bool
    {
        return in_array($this, [self::Queued, self::Running, self::Validating], true);
    }

    public function isTerminal(): bool
    {
        return ! $this->isActive();
    }

    /** @return list<string> */
    public static function activeValues(): array
    {
        return array_map(
            static fn (self $status): string => $status->value,
            array_filter(self::cases(), static fn (self $status): bool => $status->isActive()),
        );
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Queued => in_array($next, [self::Running, self::Cancelled], true),
            self::Running => in_array($next, [self::Validating, self::Failed, self::Cancelled], true),
            self::Validating => in_array($next, [self::Succeeded, self::Failed, self::Cancelled], true),
            self::Succeeded, self::Failed, self::Cancelled => false,
        };
    }
}
