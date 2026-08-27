<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Actions\AuthenticateUser;
use App\Modules\Identity\Presentation\Http\Requests\LoginRequest;
use App\Modules\Identity\Presentation\Http\Resources\AuthenticationResource;
use Illuminate\Http\JsonResponse;

final class LoginController
{
    public function __invoke(LoginRequest $request, AuthenticateUser $authenticateUser): JsonResponse
    {
        $result = $authenticateUser->execute(
            (string) $request->validated('email'),
            (string) $request->validated('password'),
        );

        return (new AuthenticationResource($result))->response()
            ->header('Cache-Control', 'no-store')
            ->header('Pragma', 'no-cache');
    }
}
