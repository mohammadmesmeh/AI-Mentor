<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Queries;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Exceptions\RoadmapGenerationRequestNotFoundException;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;

final class FindOwnedGenerationRequest
{
    public function execute(User $user, string $id): RoadmapGenerationRequest
    {
        $request = $user->roadmapGenerationRequests()->whereKey($id)->first();

        if ($request === null) {
            throw new RoadmapGenerationRequestNotFoundException;
        }

        return $request;
    }
}
