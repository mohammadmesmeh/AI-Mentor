<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Application\Queries\GetLearningProfile;
use App\Modules\LearningProfile\Presentation\Http\Resources\LearningProfileResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final class GetLearningProfileController
{
    /** @throws AuthenticationException */
    public function __invoke(Request $request, GetLearningProfile $getLearningProfile): LearningProfileResource
    {
        $user = $request->user('web');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new LearningProfileResource($getLearningProfile->execute($user));
    }
}
