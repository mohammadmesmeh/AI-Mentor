<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Application\Actions\CalculateOnboardingStatus;
use App\Modules\LearningProfile\Presentation\Http\Resources\OnboardingStatusResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

final class GetOnboardingStatusController
{
    /** @throws AuthenticationException */
    public function __invoke(
        Request $request,
        CalculateOnboardingStatus $calculateOnboardingStatus,
    ): OnboardingStatusResource {
        $user = $request->user('web');

        if (! $user instanceof User) {
            throw new AuthenticationException;
        }

        return new OnboardingStatusResource($calculateOnboardingStatus->execute($user));
    }
}
