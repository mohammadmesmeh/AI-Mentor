<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Application\Actions\CalculateOnboardingStatus;
use App\Modules\Roadmap\Application\Data\GenerationRequestResult;
use App\Modules\Roadmap\Application\Exceptions\OnboardingIncompleteException;
use App\Modules\Roadmap\Application\Exceptions\RoadmapGenerationInProgressException;
use App\Modules\Roadmap\Application\Jobs\GenerateRoadmapJob;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class RequestRoadmapGeneration
{
    public function __construct(
        private CalculateOnboardingStatus $calculateOnboardingStatus,
        private BuildGenerationInputSnapshot $buildSnapshot,
    ) {}

    public function execute(User $authenticatedUser, string $idempotencyKey): GenerationRequestResult
    {
        $keyHash = hash('sha256', $idempotencyKey);

        $result = DB::transaction(function () use ($authenticatedUser, $keyHash): GenerationRequestResult {
            $user = User::query()->whereKey($authenticatedUser->getKey())->lockForUpdate()->firstOrFail();

            $existing = $user->roadmapGenerationRequests()
                ->where('idempotency_key_hash', $keyHash)
                ->first();

            if ($existing !== null) {
                return new GenerationRequestResult($existing, true);
            }

            $onboarding = $this->calculateOnboardingStatus->execute($user);

            if (! $onboarding['completed']) {
                throw new OnboardingIncompleteException($onboarding['missing_fields']);
            }

            $active = $user->roadmapGenerationRequests()
                ->whereIn('status', GenerationRequestStatus::activeValues())
                ->lockForUpdate()
                ->first();

            if ($active !== null) {
                throw new RoadmapGenerationInProgressException((string) $active->getKey());
            }

            $profile = $user->learningProfile()->firstOrFail();
            $preference = $user->preference()->firstOrFail();

            $generationRequest = $user->roadmapGenerationRequests()->create([
                'correlation_id' => (string) Str::ulid(),
                'idempotency_key_hash' => $keyHash,
                'status' => GenerationRequestStatus::Queued,
                'active_slot' => 1,
                'snapshot_schema_version' => BuildGenerationInputSnapshot::SCHEMA_VERSION,
                'input_snapshot' => $this->buildSnapshot->execute($profile, $preference),
            ]);

            return new GenerationRequestResult($generationRequest, false);
        }, 3);

        if (! $result->replayed) {
            GenerateRoadmapJob::dispatch((string) $result->request->getKey());
        }

        return $result;
    }
}
