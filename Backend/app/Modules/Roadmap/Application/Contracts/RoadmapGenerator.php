<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Contracts;

interface RoadmapGenerator
{
    /** @param array<string, mixed> $snapshot
     * @return array<string, mixed>
     */
    public function generate(array $snapshot): array;
}
