<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Roadmap\Application\Jobs\GenerateRoadmapJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

final class AuthenticationHttpFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_bearer_authentication_lifecycle_across_protected_modules(): void
    {
        Queue::fake();

        $registered = $this->postJson('/api/v1/auth/register', [
            'name' => 'Lifecycle User',
            'email' => 'lifecycle@example.com',
            'password' => 'correct-password',
            'password_confirmation' => 'correct-password',
        ])->assertCreated();
        $firstAccess = (string) $registered->json('data.access_token');
        $firstRefresh = (string) $registered->json('data.refresh_token');
        $userId = (string) $registered->json('data.user.id');

        $this->withToken($firstAccess)->getJson('/api/v1/me')
            ->assertOk()->assertJsonPath('data.id', $userId);
        $this->withToken($firstAccess)->patchJson('/api/v1/me/preferences', [
            'ui_locale' => 'ar',
            'resource_language' => 'ar',
            'timezone' => 'Asia/Hebron',
        ])->assertOk()->assertJsonPath('data.resource_language', 'ar');
        $this->withToken($firstAccess)->putJson('/api/v1/me/learning-profile', [
            'goal' => 'Build secure Laravel APIs',
            'self_assessed_level' => 'some_experience',
            'desired_outcome' => 'Ship the AI Mentor backend',
            'available_minutes_per_week' => 360,
            'preferred_learning_methods' => ['hands_on_projects', 'reading_docs'],
        ])->assertCreated();
        $this->withToken($firstAccess)->getJson('/api/v1/me/onboarding-status')
            ->assertOk()->assertJsonPath('data.completed', true);

        $generation = $this->withToken($firstAccess)->postJson(
            '/api/v1/roadmap-generation-requests',
            [],
            ['Idempotency-Key' => 'jwt-lifecycle-generation-1'],
        )->assertAccepted();
        $generationId = (string) $generation->json('data.id');
        $this->withToken($firstAccess)->getJson('/api/v1/roadmap-generation-requests/'.$generationId)
            ->assertOk()->assertJsonPath('data.id', $generationId);

        $rotated = $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $firstRefresh])
            ->assertOk();
        $secondAccess = (string) $rotated->json('data.access_token');
        $secondRefresh = (string) $rotated->json('data.refresh_token');

        $this->withToken($secondAccess)->getJson('/api/v1/me')
            ->assertOk()->assertJsonPath('data.id', $userId);
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $firstRefresh])->assertUnauthorized();
        $this->withToken($secondAccess)->getJson('/api/v1/me')->assertUnauthorized();

        $loggedIn = $this->postJson('/api/v1/auth/login', [
            'email' => 'lifecycle@example.com',
            'password' => 'correct-password',
        ])->assertOk();
        $logoutAccess = (string) $loggedIn->json('data.access_token');
        $logoutRefresh = (string) $loggedIn->json('data.refresh_token');

        $this->withToken($logoutAccess)->getJson('/api/v1/me')->assertOk();
        $this->withToken($logoutAccess)->postJson('/api/v1/auth/logout', [
            'refresh_token' => $logoutRefresh,
        ])->assertNoContent();
        $this->withToken($logoutAccess)->getJson('/api/v1/me')->assertUnauthorized();
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $logoutRefresh])->assertUnauthorized();

        self::assertNotSame($firstAccess, $secondAccess);
        self::assertNotSame($firstRefresh, $secondRefresh);
        Queue::assertPushed(GenerateRoadmapJob::class, 1);
    }
}
