<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

final class RoadmapGenerationRequestApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_endpoints_require_authentication(): void
    {
        $this->postJson('/api/v1/roadmap-generation-requests', [], $this->keyHeader())->assertUnauthorized();
        $this->getJson('/api/v1/roadmap-generation-requests/'.Str::ulid())->assertUnauthorized();
    }

    public function test_create_requires_a_valid_header_and_rejects_all_body_fields(): void
    {
        $user = $this->completeUser();

        $this->actingAs($user, 'web')->postJson('/api/v1/roadmap-generation-requests')
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonPath('error.details.idempotency_key.0', 'The idempotency key field is required.');

        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests',
            [],
            ['Idempotency-Key' => 'spaces are invalid'],
        )->assertUnprocessable()->assertJsonPath('error.details.idempotency_key.0', 'The idempotency key field format is invalid.');

        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests',
            ['goal' => 'client snapshot injection'],
            $this->keyHeader(),
        )->assertUnprocessable()->assertJsonPath('error.details.goal.0', 'Request body fields are not allowed.');
    }

    public function test_incomplete_onboarding_returns_all_missing_fields_without_creating_a_request(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $this->keyHeader())
            ->assertConflict()
            ->assertJsonPath('error.code', 'onboarding_incomplete')
            ->assertJsonPath('error.details.missing_fields', [
                'goal',
                'self_assessed_level',
                'desired_outcome',
                'available_minutes_per_week',
                'preferred_learning_methods',
                'resource_language',
            ])
            ->assertJsonStructure(['meta' => ['request_id']]);

        self::assertDatabaseCount('roadmap_generation_requests', 0);
    }

    public function test_create_persists_a_queued_request_and_server_owned_immutable_snapshot_only(): void
    {
        Queue::fake();
        $user = $this->completeUser();
        $key = 'generation-key-0001';

        $response = $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests',
            [],
            ['Idempotency-Key' => $key],
        )->assertAccepted()
            ->assertHeader('Idempotency-Replayed', 'false')
            ->assertJsonPath('data.status', 'queued')
            ->assertJsonPath('data.roadmap_id', null)
            ->assertJsonStructure(['data' => [
                'id', 'status', 'roadmap_id', 'failure_code', 'created_at', 'started_at', 'completed_at', 'status_url',
            ], 'meta' => ['request_id']]);

        $id = $response->json('data.id');
        $request = RoadmapGenerationRequest::query()->findOrFail($id);

        self::assertNull($request->idempotency_key);
        self::assertSame(hash('sha256', $key), $request->idempotency_key_hash);
        self::assertSame(1, $request->active_slot);
        self::assertSame(1, $request->snapshot_schema_version);
        $level = $user->learningProfile->getAttribute('self_assessed_level');
        self::assertInstanceOf(\BackedEnum::class, $level);

        self::assertEquals([
            'schema_version' => 1,
            'learning_profile' => [
                'goal' => $user->learningProfile->goal,
                'self_assessed_level' => $level->value,
                'desired_outcome' => $user->learningProfile->desired_outcome,
                'available_minutes_per_week' => $user->learningProfile->available_minutes_per_week,
                'preferred_learning_methods' => $user->learningProfile->preferred_learning_methods,
            ],
            'preferences' => ['resource_language' => ResourceLanguage::Arabic->value],
        ], $request->input_snapshot);
        self::assertDatabaseCount('roadmaps', 0);
        self::assertDatabaseCount('roadmap_versions', 0);
        self::assertDatabaseCount('personal_access_tokens', 0);
        Queue::assertNothingPushed();
    }

    public function test_active_replay_returns_same_request_without_rebuilding_snapshot_or_changing_state(): void
    {
        $user = $this->completeUser();
        $headers = $this->keyHeader('stable-replay-key');
        $first = $this->actingAs($user, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $headers)
            ->assertAccepted();
        $id = $first->json('data.id');
        $before = RoadmapGenerationRequest::query()->findOrFail($id);
        $snapshot = $before->input_snapshot;
        $createdAt = $before->created_at;

        $user->learningProfile()->update([
            'goal' => 'A changed goal after submission',
            'preferred_learning_methods' => null,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $headers)
            ->assertAccepted()
            ->assertHeader('Idempotency-Replayed', 'true')
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.status', 'queued');

        $replayed = RoadmapGenerationRequest::query()->findOrFail($id);
        self::assertSame($snapshot, $replayed->input_snapshot);
        self::assertTrue($createdAt->equalTo($replayed->created_at));
        self::assertDatabaseCount('roadmap_generation_requests', 1);
    }

    public function test_terminal_replay_returns_200_and_same_request(): void
    {
        $user = $this->completeUser();
        $key = 'terminal-replay-key';
        $request = RoadmapGenerationRequest::factory()->for($user)->terminal()->create([
            'idempotency_key_hash' => hash('sha256', $key),
        ]);

        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests', [], ['Idempotency-Key' => $key],
        )->assertOk()
            ->assertHeader('Idempotency-Replayed', 'true')
            ->assertJsonPath('data.id', $request->id)
            ->assertJsonPath('data.status', 'succeeded');
    }

    #[DataProvider('activeStatusProvider')]
    public function test_new_key_is_rejected_for_every_active_enum_status(GenerationRequestStatus $status): void
    {
        $user = $this->completeUser();
        $active = RoadmapGenerationRequest::factory()->for($user)->create(['status' => $status]);

        $this->actingAs($user, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $this->keyHeader('different-new-key'))
            ->assertConflict()
            ->assertJsonPath('error.code', 'roadmap_generation_in_progress')
            ->assertJsonPath('error.details.generation_request_id', $active->id);

        self::assertDatabaseCount('roadmap_generation_requests', 1);
    }

    /** @return iterable<string, array{GenerationRequestStatus}> */
    public static function activeStatusProvider(): iterable
    {
        yield 'queued' => [GenerationRequestStatus::Queued];
        yield 'running' => [GenerationRequestStatus::Running];
        yield 'validating' => [GenerationRequestStatus::Validating];
    }

    #[DataProvider('terminalStatusProvider')]
    public function test_new_key_is_allowed_after_every_terminal_enum_status(GenerationRequestStatus $status): void
    {
        $user = $this->completeUser();
        RoadmapGenerationRequest::factory()->for($user)->terminal($status)->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $this->keyHeader('next-generation-key'))
            ->assertAccepted()
            ->assertHeader('Idempotency-Replayed', 'false');

        self::assertDatabaseCount('roadmap_generation_requests', 2);
    }

    /** @return iterable<string, array{GenerationRequestStatus}> */
    public static function terminalStatusProvider(): iterable
    {
        yield 'succeeded' => [GenerationRequestStatus::Succeeded];
        yield 'failed' => [GenerationRequestStatus::Failed];
        yield 'cancelled' => [GenerationRequestStatus::Cancelled];
    }

    public function test_same_idempotency_key_is_scoped_per_user(): void
    {
        $firstUser = $this->completeUser();
        $secondUser = $this->completeUser();
        $headers = $this->keyHeader('shared-across-users');

        $firstId = $this->actingAs($firstUser, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $headers)->json('data.id');
        $secondId = $this->actingAs($secondUser, 'web')
            ->postJson('/api/v1/roadmap-generation-requests', [], $headers)->json('data.id');

        self::assertNotSame($firstId, $secondId);
        self::assertDatabaseCount('roadmap_generation_requests', 2);
    }

    public function test_get_is_owner_scoped_and_does_not_expose_internal_fields(): void
    {
        $owner = $this->completeUser();
        $other = $this->completeUser();
        $generationRequest = RoadmapGenerationRequest::factory()->for($owner)->create([
            'provider' => 'internal-provider',
            'failure_message' => 'sensitive failure detail',
        ]);

        $response = $this->actingAs($owner, 'web')
            ->getJson('/api/v1/roadmap-generation-requests/'.$generationRequest->id)
            ->assertOk()
            ->assertJsonPath('data.id', $generationRequest->id);

        foreach (['input_snapshot', 'idempotency_key', 'idempotency_key_hash', 'snapshot_schema_version', 'provider', 'model', 'prompt_version', 'failure_message', 'validated_output'] as $field) {
            self::assertArrayNotHasKey($field, $response->json('data'));
        }

        $this->actingAs($other, 'web')
            ->getJson('/api/v1/roadmap-generation-requests/'.$generationRequest->id)
            ->assertNotFound()
            ->assertJsonPath('error.code', 'roadmap_generation_request_not_found');

        $this->actingAs($owner, 'web')
            ->getJson('/api/v1/roadmap-generation-requests/'.Str::ulid())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'roadmap_generation_request_not_found');
    }

    public function test_create_is_limited_to_three_attempts_per_minute_per_user(): void
    {
        $user = $this->completeUser();

        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests', [], $this->keyHeader('rate-limit-key-1'),
        )->assertAccepted();
        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests', [], $this->keyHeader('rate-limit-key-2'),
        )->assertConflict();
        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests', [], $this->keyHeader('rate-limit-key-3'),
        )->assertConflict();
        $this->actingAs($user, 'web')->postJson(
            '/api/v1/roadmap-generation-requests', [], $this->keyHeader('rate-limit-key-4'),
        )->assertTooManyRequests()->assertJsonPath('error.code', 'too_many_requests');
    }

    public function test_database_uniques_defend_idempotency_and_active_slot_invariants(): void
    {
        $user = $this->completeUser();
        $first = RoadmapGenerationRequest::factory()->for($user)->create();

        try {
            RoadmapGenerationRequest::factory()->for($user)->create([
                'idempotency_key_hash' => $first->idempotency_key_hash,
                'active_slot' => null,
                'status' => GenerationRequestStatus::Failed,
            ]);
            self::fail('Expected the per-user idempotency unique constraint to reject the duplicate.');
        } catch (QueryException) {
            $this->addToAssertionCount(1);
        }

        try {
            RoadmapGenerationRequest::factory()->for($user)->create();
            self::fail('Expected the per-user active-slot unique constraint to reject the duplicate.');
        } catch (QueryException) {
            $this->addToAssertionCount(1);
        }
    }

    public function test_snapshot_and_idempotency_identity_cannot_be_mutated(): void
    {
        $request = RoadmapGenerationRequest::factory()->create();

        $this->expectException(\LogicException::class);
        $request->update(['input_snapshot' => ['schema_version' => 2]]);
    }

    public function test_routes_use_sanctum_and_only_post_uses_the_named_rate_limit(): void
    {
        $store = Route::getRoutes()->getByName('api.v1.roadmap-generation-requests.store');
        $show = Route::getRoutes()->getByName('api.v1.roadmap-generation-requests.show');

        self::assertNotNull($store);
        self::assertNotNull($show);
        self::assertContains('auth:sanctum', $store->gatherMiddleware());
        self::assertContains('throttle:roadmap-generation.create', $store->gatherMiddleware());
        self::assertContains('auth:sanctum', $show->gatherMiddleware());
    }

    private function completeUser(): User
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create(['resource_language' => ResourceLanguage::Arabic]);
        LearningProfile::factory()->for($user)->create();

        return $user->refresh();
    }

    /** @return array{Idempotency-Key: string} */
    private function keyHeader(string $key = 'generation-key-1234'): array
    {
        return ['Idempotency-Key' => $key];
    }
}
