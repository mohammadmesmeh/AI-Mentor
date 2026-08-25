<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Application\Actions;

use App\Modules\Roadmap\Domain\ActiveRoadmapSlot;
use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Support\Facades\DB;

final class ActivateRoadmap
{
    public function execute(Roadmap $roadmap): Roadmap
    {
        return DB::transaction(function () use ($roadmap): Roadmap {
            Roadmap::query()
                ->where('user_id', $roadmap->user_id)
                ->lockForUpdate()
                ->get();

            Roadmap::query()
                ->where('user_id', $roadmap->user_id)
                ->whereNotNull('active_slot')
                ->update(['active_slot' => null]);

            $roadmap->forceFill([
                'active_slot' => ActiveRoadmapSlot::CURRENT,
                'status' => RoadmapStatus::Active,
                'activated_at' => $roadmap->activated_at ?? now(),
            ])->save();

            return $roadmap->refresh();
        });
    }
}
