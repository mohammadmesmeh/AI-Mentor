<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Queries;

use App\Modules\Identity\Application\Exceptions\UserPreferenceNotFoundException;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;

final class GetUserPreference
{
    /** @throws UserPreferenceNotFoundException */
    public function execute(User $user): UserPreference
    {
        return $user->preference()->first() ?? throw new UserPreferenceNotFoundException;
    }
}
