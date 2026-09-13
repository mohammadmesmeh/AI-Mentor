<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Presentation\Http\Resources\UserResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final class MeController
{
    /** @throws AuthenticationException */
    public function __invoke(Request $request): UserResource
    {
        $user = $request->user('jwt');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new UserResource($user);
    }
}
