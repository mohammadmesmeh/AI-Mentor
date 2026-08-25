<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\LearningProfile\Domain\Enums\LearningMethod;
use App\Modules\LearningProfile\Domain\Enums\SelfAssessedLevel;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class LearningProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_read_or_put_a_learning_profile(): void
    {
        $this->getJson('/api/v1/me/learning-profile')->assertUnauthorized();
        $this->putJson('/api/v1/me/learning-profile', $this->validPayload())->assertUnauthorized();
    }

    public function test_missing_profile_returns_the_specific_404_envelope(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->getJson('/api/v1/me/learning-profile')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'learning_profile_not_found')
            ->assertJsonStructure(['error' => ['code', 'message'], 'meta' => ['request_id']]);

        $this->assertValidRequestId($response->json('meta.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_existing_incomplete_legacy_profile_is_returned_with_nullable_schema_fields(): void
    {
        $user = User::factory()->create();
        LearningProfile::factory()->for($user)->create([
            'desired_outcome' => null,
            'preferred_learning_methods' => null,
        ]);

        $this->actingAs($user, 'web')->getJson('/api/v1/me/learning-profile')
            ->assertOk()
            ->assertJsonPath('data.desired_outcome', null)
            ->assertJsonPath('data.preferred_learning_methods', null);
    }

    public function test_first_put_creates_one_owned_profile_without_side_effects_or_internal_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->putJson('/api/v1/me/learning-profile', [
            ...$this->validPayload(),
            'goal' => '  Learn backend architecture  ',
            'desired_outcome' => '  Build a production API  ',
        ])->assertCreated()
            ->assertJsonPath('data.goal', 'Learn backend architecture')
            ->assertJsonPath('data.desired_outcome', 'Build a production API')
            ->assertJsonPath('data.self_assessed_level', SelfAssessedLevel::SomeExperience->value)
            ->assertJsonPath('data.preferred_learning_methods.0', LearningMethod::HandsOnProjects->value)
            ->assertJsonMissingPath('data.user_id')
            ->assertJsonMissingPath('data.onboarding_completed_at')
            ->assertJsonStructure(['data' => [
                'id',
                'goal',
                'self_assessed_level',
                'desired_outcome',
                'available_minutes_per_week',
                'preferred_learning_methods',
                'created_at',
                'updated_at',
            ], 'meta' => ['request_id']]);

        $profile = $user->learningProfile()->firstOrFail();
        self::assertTrue(Str::isUlid($profile->id));
        self::assertSame($user->id, $profile->user_id);
        self::assertNull($profile->onboarding_completed_at);
        $this->assertDatabaseCount('learning_profiles', 1);
        $this->assertDatabaseCount('roadmaps', 0);
        $this->assertDatabaseCount('roadmap_generation_requests', 0);
        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertValidRequestId($response->json('meta.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_subsequent_and_repeated_puts_update_the_same_profile(): void
    {
        $user = User::factory()->create();
        $profile = LearningProfile::factory()->for($user)->create();
        $payload = [...$this->validPayload(), 'goal' => 'Updated goal'];

        $this->actingAs($user, 'web')->putJson('/api/v1/me/learning-profile', $payload)
            ->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.goal', 'Updated goal');

        $this->putJson('/api/v1/me/learning-profile', $payload)
            ->assertOk()
            ->assertJsonPath('data.id', $profile->id);

        $this->assertDatabaseCount('learning_profiles', 1);
        self::assertSame($user->id, $profile->refresh()->user_id);
    }

    public function test_reads_and_writes_are_scoped_to_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherProfile = LearningProfile::factory()->for($otherUser)->create(['goal' => 'Other goal']);

        $this->actingAs($user, 'web')->getJson('/api/v1/me/learning-profile')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'learning_profile_not_found');

        $this->putJson('/api/v1/me/learning-profile', $this->validPayload())->assertCreated();

        self::assertSame('Other goal', $otherProfile->refresh()->goal);
        self::assertSame($otherUser->id, $otherProfile->user_id);
        self::assertNotSame($otherProfile->id, $user->learningProfile()->firstOrFail()->id);
    }

    public function test_required_fields_and_all_internal_fields_are_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')->putJson('/api/v1/me/learning-profile', [
            'user_id' => User::factory()->create()->id,
            'id' => (string) Str::ulid(),
            'onboarding_completed_at' => now()->toISOString(),
            'completed' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ])->assertUnprocessable()
            ->assertJsonStructure(['error' => ['details' => [
                'goal',
                'self_assessed_level',
                'desired_outcome',
                'available_minutes_per_week',
                'preferred_learning_methods',
                'user_id',
                'id',
                'onboarding_completed_at',
                'completed',
                'created_at',
                'updated_at',
            ]]]);

        $this->assertDatabaseCount('learning_profiles', 0);
    }

    public function test_enum_array_and_numeric_constraints_are_enforced(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')->putJson('/api/v1/me/learning-profile', [
            ...$this->validPayload(),
            'self_assessed_level' => 'expert',
            'available_minutes_per_week' => -1,
            'preferred_learning_methods' => ['podcasts', 'podcasts'],
        ])->assertUnprocessable()
            ->assertJsonStructure(['error' => ['details' => [
                'self_assessed_level',
                'available_minutes_per_week',
                'preferred_learning_methods.0',
                'preferred_learning_methods.1',
            ]]]);

        $this->putJson('/api/v1/me/learning-profile', [
            ...$this->validPayload(),
            'available_minutes_per_week' => 10081,
        ])->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['available_minutes_per_week']]]);

        $this->putJson('/api/v1/me/learning-profile', [
            ...$this->validPayload(),
            'preferred_learning_methods' => ['primary' => LearningMethod::ReadingDocs->value],
        ])->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['preferred_learning_methods']]]);
    }

    public function test_goal_and_desired_outcome_length_limits_are_enforced(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')->putJson('/api/v1/me/learning-profile', [
            ...$this->validPayload(),
            'goal' => str_repeat('a', 1001),
            'desired_outcome' => str_repeat('b', 2001),
        ])->assertUnprocessable()
            ->assertJsonStructure(['error' => ['details' => ['goal', 'desired_outcome']]]);
    }

    public function test_mysql_unique_constraint_prevents_two_profiles_for_one_user(): void
    {
        $user = User::factory()->create();
        LearningProfile::factory()->for($user)->create();

        $this->expectException(QueryException::class);
        LearningProfile::factory()->for($user)->create();
    }

    /** @return array<string, mixed> */
    private function validPayload(): array
    {
        return [
            'goal' => 'Learn Laravel architecture',
            'self_assessed_level' => SelfAssessedLevel::SomeExperience->value,
            'desired_outcome' => 'Ship a maintainable backend service',
            'available_minutes_per_week' => 300,
            'preferred_learning_methods' => [
                LearningMethod::HandsOnProjects->value,
                LearningMethod::ReadingDocs->value,
            ],
        ];
    }

    private function assertValidRequestId(mixed $requestId, ?string $header): void
    {
        self::assertIsString($requestId);
        self::assertTrue(Str::isUlid($requestId));
        self::assertSame($requestId, $header);
    }
}
