<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class GenerationRequestStatusTest extends TestCase
{
    public function test_actual_enum_defines_the_active_and_terminal_sets(): void
    {
        self::assertSame(['queued', 'running', 'validating'], GenerationRequestStatus::activeValues());

        foreach (GenerationRequestStatus::cases() as $status) {
            self::assertNotSame($status->isActive(), $status->isTerminal());
        }
    }

    #[DataProvider('transitionProvider')]
    public function test_lifecycle_transition_rules(
        GenerationRequestStatus $from,
        GenerationRequestStatus $to,
        bool $allowed,
    ): void {
        self::assertSame($allowed, $from->canTransitionTo($to));
    }

    /** @return iterable<string, array{GenerationRequestStatus, GenerationRequestStatus, bool}> */
    public static function transitionProvider(): iterable
    {
        yield 'queued starts processing' => [GenerationRequestStatus::Queued, GenerationRequestStatus::Running, true];
        yield 'queued cannot skip validation' => [GenerationRequestStatus::Queued, GenerationRequestStatus::Succeeded, false];
        yield 'queued cannot fail before running' => [GenerationRequestStatus::Queued, GenerationRequestStatus::Failed, false];
        yield 'running enters validation' => [GenerationRequestStatus::Running, GenerationRequestStatus::Validating, true];
        yield 'validation succeeds' => [GenerationRequestStatus::Validating, GenerationRequestStatus::Succeeded, true];
        yield 'active request may fail' => [GenerationRequestStatus::Running, GenerationRequestStatus::Failed, true];
        yield 'terminal request stays terminal' => [GenerationRequestStatus::Succeeded, GenerationRequestStatus::Running, false];
    }
}
