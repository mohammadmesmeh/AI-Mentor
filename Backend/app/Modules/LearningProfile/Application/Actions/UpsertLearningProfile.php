<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Application\Actions;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use Illuminate\Support\Facades\DB;

final class UpsertLearningProfile
{
    /**
     * @param  array{goal: string, self_assessed_level: string, desired_outcome: string, available_minutes_per_week: int, preferred_learning_methods: list<string>}  $attributes
     * @return array{profile: LearningProfile, created: bool}
     */
    public function execute(User $user, array $attributes): array
    {
        return DB::transaction(static function () use ($user, $attributes): array {
            User::query()->whereKey($user->getKey())->lockForUpdate()->firstOrFail();
            $profile = $user->learningProfile()->first();
            $created = $profile === null;

            if ($profile === null) {
                $profile = $user->learningProfile()->create($attributes);
            } else {
                $profile->fill($attributes)->save();
            }

            return ['profile' => $profile->refresh(), 'created' => $created];
        });
    }
}
