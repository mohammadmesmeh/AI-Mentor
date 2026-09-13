<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Application\Queries;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Application\Exceptions\LearningProfileNotFoundException;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;

final class GetLearningProfile
{
    /** @throws LearningProfileNotFoundException */
    public function execute(User $user): LearningProfile
    {
        return $user->learningProfile()->first() ?? throw new LearningProfileNotFoundException;
    }
}
