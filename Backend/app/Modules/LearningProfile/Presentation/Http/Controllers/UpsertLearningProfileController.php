<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Application\Actions\UpsertLearningProfile;
use App\Modules\LearningProfile\Presentation\Http\Requests\UpsertLearningProfileRequest;
use App\Modules\LearningProfile\Presentation\Http\Resources\LearningProfileResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;

final class UpsertLearningProfileController
{
    /** @throws AuthenticationException */
    public function __invoke(
        UpsertLearningProfileRequest $request,
        UpsertLearningProfile $upsertLearningProfile,
    ): JsonResponse {
        $user = $request->user('jwt');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        $result = $upsertLearningProfile->execute($user, $request->validated());

        return (new LearningProfileResource($result['profile']))
            ->response()
            ->setStatusCode($result['created'] ? 201 : 200);
    }
}
