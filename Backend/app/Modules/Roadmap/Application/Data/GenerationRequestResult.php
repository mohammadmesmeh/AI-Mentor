<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Data;

use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;

final readonly class GenerationRequestResult
{
    public function __construct(
        public RoadmapGenerationRequest $request,
        public bool $replayed,
    ) {}
}
