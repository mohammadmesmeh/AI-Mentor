<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Actions\RegisterUser;
use App\Modules\Identity\Presentation\Http\Requests\RegisterRequest;
use App\Modules\Identity\Presentation\Http\Resources\AuthenticationResource;
use Illuminate\Http\JsonResponse;

final class RegisterController
{
    public function __invoke(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        $result = $registerUser->execute($request->safe()->only(['name', 'email', 'password']));

        return (new AuthenticationResource($result))->response()
            ->setStatusCode(201)
            ->header('Cache-Control', 'no-store')
            ->header('Pragma', 'no-cache');
    }
}
