<?php

declare(strict_types=1);

return [
    'secret' => env('JWT_SECRET'),
    'issuer' => env('JWT_ISSUER', 'ai-mentor-backend'),
    'audience' => env('JWT_AUDIENCE', 'ai-mentor-clients'),
    'access_ttl_minutes' => (int) env('JWT_ACCESS_TTL_MINUTES', 15),
    'refresh_ttl_days' => (int) env('JWT_REFRESH_TTL_DAYS', 30),
    'clock_skew_seconds' => (int) env('JWT_CLOCK_SKEW_SECONDS', 30),
    'redis_prefix' => env('JWT_REDIS_PREFIX', 'ai-mentor:auth:revoked'),
];
