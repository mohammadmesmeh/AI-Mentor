<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Queries;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Exceptions\RoadmapNotFoundException;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;

final class FindOwnedRoadmap
{
    public function execute(User $user, string $id): Roadmap
    {
        $roadmap = $user->roadmaps()
            ->with([
                'currentVersion.stages.tasks.taskType',
                'currentVersion.stages.tasks.dependencies',
                'currentVersion.stages.tasks.resources',
            ])
            ->whereKey($id)
            ->first();

        if ($roadmap === null) {
            throw new RoadmapNotFoundException;
        }

        return $roadmap;
    }
}
