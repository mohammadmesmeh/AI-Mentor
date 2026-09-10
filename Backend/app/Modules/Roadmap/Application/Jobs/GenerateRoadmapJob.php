<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Jobs;

use App\Modules\Roadmap\Application\Actions\ProcessRoadmapGeneration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class GenerateRoadmapJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(public readonly string $generationRequestId) {}

    public function handle(ProcessRoadmapGeneration $processor): void
    {
        $processor->execute($this->generationRequestId);
    }
}
