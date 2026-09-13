<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Actions;

use App\Modules\Identity\Application\Queries\GetUserPreference;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;

final readonly class UpdateUserPreference
{
    public function __construct(private GetUserPreference $getUserPreference) {}

    /** @param array{ui_locale?: string, resource_language?: string, timezone?: string} $attributes */
    public function execute(User $user, array $attributes): UserPreference
    {
        $preference = $this->getUserPreference->execute($user);
        $preference->fill($attributes)->save();

        return $preference->refresh();
    }
}
