<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Actions\RequestRoadmapGeneration;
use App\Modules\Roadmap\Presentation\Http\Requests\CreateRoadmapGenerationRequestRequest;
use App\Modules\Roadmap\Presentation\Http\Resources\RoadmapGenerationRequestResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;

final class CreateRoadmapGenerationRequestController
{
    /** @throws AuthenticationException */
    public function __invoke(
        CreateRoadmapGenerationRequestRequest $request,
        RequestRoadmapGeneration $requestRoadmapGeneration,
    ): JsonResponse {
        $user = $request->user('web');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        $result = $requestRoadmapGeneration->execute($user, $request->idempotencyKey());
        $status = $result->request->isActive() ? 202 : 200;
        $location = route('api.v1.roadmap-generation-requests.show', [
            'generationRequest' => $result->request->getKey(),
        ]);

        return (new RoadmapGenerationRequestResource($result->request))
            ->response()
            ->setStatusCode($status)
            ->header('Location', $location)
            ->header('Idempotency-Replayed', $result->replayed ? 'true' : 'false');
    }
}
