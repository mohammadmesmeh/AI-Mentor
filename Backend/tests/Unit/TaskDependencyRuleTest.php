<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Modules\TaskExecution\Domain\TaskDependencyRule;
use DomainException;
use PHPUnit\Framework\TestCase;

final class TaskDependencyRuleTest extends TestCase
{
    public function test_same_identifier_is_rejected_without_framework_dependencies(): void
    {
        $this->expectException(DomainException::class);

        (new TaskDependencyRule)->ensureDifferentTasks('same', 'same');
    }
}
