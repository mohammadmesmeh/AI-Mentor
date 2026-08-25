<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

final class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_returns_the_standard_response_structure(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.service', 'ai-mentor-backend')
            ->assertJsonStructure([
                'data' => ['status', 'service'],
                'meta' => ['request_id'],
            ]);

        $requestId = $response->json('meta.request_id');

        self::assertIsString($requestId);
        self::assertTrue(Str::isUlid($requestId));
        self::assertSame($requestId, $response->headers->get('X-Request-ID'));
    }

    public function test_api_errors_use_the_standard_response_structure(): void
    {
        $response = $this->getJson('/api/v1/not-a-route')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'not_found')
            ->assertJsonStructure([
                'error' => ['code', 'message'],
                'meta' => ['request_id'],
            ]);

        $requestId = $response->json('meta.request_id');

        self::assertIsString($requestId);
        self::assertTrue(Str::isUlid($requestId));
        self::assertSame($requestId, $response->headers->get('X-Request-ID'));
    }

    public function test_unauthenticated_api_requests_use_the_standard_response_structure(): void
    {
        Route::middleware('auth:sanctum')->get(
            '/api/v1/_test/protected',
            static fn (): array => ['should_not' => 'execute'],
        );

        $response = $this->getJson('/api/v1/_test/protected')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'unauthenticated')
            ->assertJsonStructure([
                'error' => ['code', 'message'],
                'meta' => ['request_id'],
            ]);

        $requestId = $response->json('meta.request_id');

        self::assertIsString($requestId);
        self::assertTrue(Str::isUlid($requestId));
        self::assertSame($requestId, $response->headers->get('X-Request-ID'));
    }
}
