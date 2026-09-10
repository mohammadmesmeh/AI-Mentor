<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Queries\FindOwnedRoadmap;
use App\Modules\Roadmap\Presentation\Http\Resources\RoadmapResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final class GetRoadmapController
{
    /** @throws AuthenticationException */
    public function __invoke(
        Request $request,
        string $roadmap,
        FindOwnedRoadmap $findOwnedRoadmap,
    ): RoadmapResource {
        $user = $request->user('jwt');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new RoadmapResource($findOwnedRoadmap->execute($user, $roadmap));
    }
}
