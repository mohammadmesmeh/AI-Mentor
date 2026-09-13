<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Resources;

use App\Modules\Identity\Application\Data\AuthenticationResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AuthenticationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var AuthenticationResult $result */
        $result = $this->resource;

        return [
            'token_type' => 'Bearer',
            'access_token' => $result->tokens->access->token,
            'expires_in' => $result->tokens->access->expiresIn,
            'refresh_token' => $result->tokens->refreshToken,
            'refresh_expires_in' => $result->tokens->refreshExpiresIn,
            'user' => (new UserResource($result->user))->resolve($request),
        ];
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }
}
