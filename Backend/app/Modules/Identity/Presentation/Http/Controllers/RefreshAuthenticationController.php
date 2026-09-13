<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Actions\RefreshAuthentication;
use App\Modules\Identity\Presentation\Http\Requests\RefreshAuthenticationRequest;
use App\Modules\Identity\Presentation\Http\Resources\AuthenticationResource;
use Illuminate\Http\JsonResponse;

final class RefreshAuthenticationController
{
    public function __invoke(
        RefreshAuthenticationRequest $request,
        RefreshAuthentication $refreshAuthentication,
    ): JsonResponse {
        $result = $refreshAuthentication->execute((string) $request->validated('refresh_token'));

        return (new AuthenticationResource($result))->response()
            ->header('Cache-Control', 'no-store')
            ->header('Pragma', 'no-cache');
    }
}
