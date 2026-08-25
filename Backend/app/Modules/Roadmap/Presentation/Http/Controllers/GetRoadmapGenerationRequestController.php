<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Queries\FindOwnedGenerationRequest;
use App\Modules\Roadmap\Presentation\Http\Resources\RoadmapGenerationRequestResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final class GetRoadmapGenerationRequestController
{
    /** @throws AuthenticationException */
    public function __invoke(
        Request $request,
        string $generationRequest,
        FindOwnedGenerationRequest $findOwnedGenerationRequest,
    ): RoadmapGenerationRequestResource {
        $user = $request->user('web');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new RoadmapGenerationRequestResource(
            $findOwnedGenerationRequest->execute($user, $generationRequest),
        );
    }
}
