<?php

declare(strict_types=1);

namespace App\Shared\Presentation\Http\Controllers;

use App\Shared\Presentation\Http\Resources\HealthResource;
use Illuminate\Http\Request;

final class HealthController
{
    public function __invoke(Request $request): HealthResource
    {
        return new HealthResource((object) [
            'status' => 'ok',
            'service' => 'ai-mentor-backend',
            'request_id' => $request->attributes->get('request_id'),
        ]);
    }
}
