<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Actions\UpdateUserPreference;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Presentation\Http\Requests\UpdateUserPreferenceRequest;
use App\Modules\Identity\Presentation\Http\Resources\UserPreferenceResource;
use Illuminate\Auth\AuthenticationException;

final class UpdateUserPreferenceController
{
    /** @throws AuthenticationException */
    public function __invoke(
        UpdateUserPreferenceRequest $request,
        UpdateUserPreference $updateUserPreference,
    ): UserPreferenceResource {
        $user = $request->user('web');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new UserPreferenceResource($updateUserPreference->execute($user, $request->validated()));
    }
}
