<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Queries\GetUserPreference;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Presentation\Http\Resources\UserPreferenceResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final class GetUserPreferenceController
{
    /** @throws AuthenticationException */
    public function __invoke(Request $request, GetUserPreference $getUserPreference): UserPreferenceResource
    {
        $user = $request->user('jwt');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new UserPreferenceResource($getUserPreference->execute($user));
    }
}
