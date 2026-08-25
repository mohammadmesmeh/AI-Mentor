<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapVersion;
use DomainException;
use Illuminate\Support\Facades\DB;

final class SetCurrentRoadmapVersion
{
    public function execute(Roadmap $roadmap, RoadmapVersion $version): Roadmap
    {
        return DB::transaction(function () use ($roadmap, $version): Roadmap {
            $lockedRoadmap = Roadmap::query()->lockForUpdate()->findOrFail($roadmap->id);
            $lockedVersion = RoadmapVersion::query()->lockForUpdate()->findOrFail($version->id);

            if ($lockedVersion->roadmap_id !== $lockedRoadmap->id) {
                throw new DomainException('The version must belong to the roadmap.');
            }

            RoadmapVersion::query()
                ->where('roadmap_id', $lockedRoadmap->id)
                ->where('status', RoadmapVersionStatus::Current->value)
                ->whereKeyNot($lockedVersion->id)
                ->update(['status' => RoadmapVersionStatus::Superseded->value]);

            $lockedVersion->update(['status' => RoadmapVersionStatus::Current]);
            $lockedRoadmap->update(['current_version_id' => $lockedVersion->id]);

            return $lockedRoadmap->refresh();
        });
    }
}
