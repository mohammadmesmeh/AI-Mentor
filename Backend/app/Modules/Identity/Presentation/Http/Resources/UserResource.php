<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Resources;

use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use LogicException;

final class UserResource extends JsonResource
{
    /** @return array{id: string, name: string, email: string, status: string, email_verified_at: ?string, last_login_at: ?string, created_at: ?string} */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;
        $status = $user->getAttribute('status');
        $emailVerifiedAt = $user->getAttribute('email_verified_at');
        $lastLoginAt = $user->getAttribute('last_login_at');

        if (! $status instanceof UserStatus) {
            throw new LogicException('The user status cast is not configured.');
        }

        return [
            'id' => (string) $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'status' => $status->value,
            'email_verified_at' => $emailVerifiedAt instanceof CarbonInterface ? $emailVerifiedAt->toISOString() : null,
            'last_login_at' => $lastLoginAt instanceof CarbonInterface ? $lastLoginAt->toISOString() : null,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }
}
