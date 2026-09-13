<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Application\Actions\AuthenticateAccessToken;
use App\Modules\Identity\Application\Actions\LogoutUser;
use App\Modules\Identity\Presentation\Http\Requests\LogoutRequest;
use Illuminate\Http\Response;

final class LogoutController
{
    public function __invoke(LogoutRequest $request, LogoutUser $logoutUser): Response
    {
        $logoutUser->execute(
            AuthenticateAccessToken::claims($request),
            (string) $request->validated('refresh_token'),
        );

        return response()->noContent();
    }
}
