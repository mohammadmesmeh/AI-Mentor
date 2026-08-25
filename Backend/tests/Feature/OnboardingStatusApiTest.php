<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use App\Modules\LearningProfile\Application\Actions\CalculateOnboardingStatus;
use App\Modules\LearningProfile\Domain\Enums\LearningMethod;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

final class OnboardingStatusApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_read_onboarding_status(): void
    {
        $this->getJson('/api/v1/me/onboarding-status')->assertUnauthorized();
    }

    public function test_user_without_profile_receives_all_required_missing_fields_from_one_rule_source(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')->getJson('/api/v1/me/onboarding-status')
            ->assertOk()
            ->assertJsonPath('data.completed', false)
            ->assertJsonPath('data.missing_fields', CalculateOnboardingStatus::REQUIRED_FIELDS)
            ->assertJsonStructure(['data' => ['completed', 'missing_fields'], 'meta' => ['request_id']]);
    }

    public function test_complete_profile_is_complete_with_optional_internal_timestamp_null(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();
        LearningProfile::factory()->for($user)->create(['onboarding_completed_at' => null]);

        $this->actingAs($user, 'web')->getJson('/api/v1/me/onboarding-status')
            ->assertOk()
            ->assertJsonPath('data.completed', true)
            ->assertJsonPath('data.missing_fields', []);
    }

    public function test_only_required_invalid_profile_fields_are_reported_missing(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();
        LearningProfile::factory()->for($user)->create([
            'desired_outcome' => null,
            'preferred_learning_methods' => null,
            'onboarding_completed_at' => now(),
        ]);

        $this->actingAs($user, 'web')->getJson('/api/v1/me/onboarding-status')
            ->assertOk()
            ->assertJsonPath('data.completed', false)
            ->assertJsonPath('data.missing_fields', ['desired_outcome', 'preferred_learning_methods']);
    }

    public function test_valid_default_preferences_are_not_missing_onboarding_fields(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();

        $response = $this->actingAs($user, 'web')->getJson('/api/v1/me/onboarding-status')
            ->assertOk();

        self::assertNotContains('ui_locale', $response->json('data.missing_fields'));
        self::assertNotContains('resource_language', $response->json('data.missing_fields'));
        self::assertNotContains('timezone', $response->json('data.missing_fields'));
    }

    public function test_invalid_stored_learning_method_keeps_onboarding_incomplete(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();
        LearningProfile::factory()->for($user)->create([
            'preferred_learning_methods' => [LearningMethod::ReadingDocs->value, 'unknown_method'],
        ]);

        $this->actingAs($user, 'web')->getJson('/api/v1/me/onboarding-status')
            ->assertOk()
            ->assertJsonPath('data.completed', false)
            ->assertJsonPath('data.missing_fields', ['preferred_learning_methods']);
    }

    public function test_all_self_service_routes_use_sanctum_authentication(): void
    {
        $routeNames = [
            'api.v1.me.preferences.show',
            'api.v1.me.preferences.update',
            'api.v1.me.learning-profile.show',
            'api.v1.me.learning-profile.upsert',
            'api.v1.me.onboarding-status.show',
        ];

        foreach ($routeNames as $routeName) {
            $route = Route::getRoutes()->getByName($routeName);

            self::assertNotNull($route);
            self::assertContains('auth:sanctum', $route->gatherMiddleware());
        }
    }
}
