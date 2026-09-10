<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use App\Modules\LearningProfile\Infrastructure\Persistence\Models\LearningProfile;
use App\Modules\Roadmap\Application\Actions\ProcessRoadmapGeneration;
use App\Modules\Roadmap\Application\Actions\ValidateGeneratedRoadmap;
use App\Modules\Roadmap\Application\Contracts\RoadmapGenerator;
use App\Modules\Roadmap\Application\Exceptions\InvalidGeneratedRoadmapException;
use App\Modules\Roadmap\Application\Jobs\GenerateRoadmapJob;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use App\Modules\Roadmap\Domain\Enums\RoadmapStatus;
use App\Modules\Roadmap\Domain\Enums\RoadmapVersionStatus;
use App\Modules\Roadmap\Infrastructure\Generation\FakeRoadmapGenerator;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use Database\Seeders\TaskTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use RuntimeException;
use Tests\TestCase;

final class LocalRoadmapGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TaskTypeSeeder::class);
    }

    public function test_http_creation_dispatches_the_job_with_the_request_identifier(): void
    {
        Queue::fake();
        $user = $this->completeUser();

        $response = $this->withJwt($user)->postJson(
            '/api/v1/roadmap-generation-requests',
            [],
            ['Idempotency-Key' => 'local-generator-dispatch'],
        )->assertAccepted();
        $requestId = (string) $response->json('data.id');

        Queue::assertPushed(
            GenerateRoadmapJob::class,
            static fn (GenerateRoadmapJob $job): bool => $job->generationRequestId === $requestId,
        );
    }

    public function test_processor_creates_a_complete_active_roadmap_and_is_idempotent(): void
    {
        $user = User::factory()->create();
        $request = $this->generationRequest($user);
        $processor = $this->app->make(ProcessRoadmapGeneration::class);

        $processor->execute($request->id);

        $request->refresh();
        self::assertSame(GenerationRequestStatus::Succeeded, $request->status);
        self::assertNotNull($request->started_at);
        self::assertNotNull($request->completed_at);
        self::assertNull($request->active_slot);
        self::assertSame('local_fake', $request->provider);
        self::assertNull($request->failure_code);
        $roadmap = $request->roadmap()->with('currentVersion.stages.tasks.dependencies')->firstOrFail();
        self::assertSame(RoadmapStatus::Active, $roadmap->status);
        self::assertSame(1, $roadmap->active_slot);
        self::assertSame(RoadmapVersionStatus::Current, $roadmap->currentVersion->status);
        self::assertSame($roadmap->current_version_id, $roadmap->currentVersion->id);
        self::assertCount(3, $roadmap->currentVersion->stages);
        self::assertSame('الأساسيات', $roadmap->currentVersion->stages->first()->title);
        self::assertSame(9, $roadmap->currentVersion->stages->sum(
            static fn ($stage): int => $stage->tasks->count(),
        ));
        self::assertDatabaseCount('task_dependencies', 8);

        $processor->execute($request->id);

        self::assertDatabaseCount('roadmaps', 1);
        self::assertDatabaseCount('roadmap_versions', 1);
        self::assertDatabaseCount('stages', 3);
        self::assertDatabaseCount('tasks', 9);
        self::assertDatabaseCount('task_dependencies', 8);
    }

    public function test_generation_request_follows_the_supported_success_transitions(): void
    {
        $request = $this->generationRequest(User::factory()->create());

        $request->transitionTo(GenerationRequestStatus::Running, ['started_at' => now()]);
        self::assertSame(GenerationRequestStatus::Running, $request->status);
        self::assertSame(1, $request->active_slot);

        $request->transitionTo(GenerationRequestStatus::Validating);
        self::assertSame(GenerationRequestStatus::Validating, $request->status);

        $request->transitionTo(GenerationRequestStatus::Succeeded, ['completed_at' => now()]);
        self::assertSame(GenerationRequestStatus::Succeeded, $request->status);
        self::assertNull($request->active_slot);
    }

    public function test_generated_roadmap_does_not_replace_an_existing_active_roadmap(): void
    {
        $user = User::factory()->create();
        $active = Roadmap::factory()->for($user)->create([
            'status' => RoadmapStatus::Active,
            'active_slot' => 1,
        ]);
        $request = $this->generationRequest($user);

        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);

        $generated = $request->refresh()->roadmap()->firstOrFail();
        self::assertSame(RoadmapStatus::Ready, $generated->status);
        self::assertNull($generated->active_slot);
        self::assertSame(1, $active->refresh()->active_slot);
        self::assertSame(RoadmapStatus::Active, $active->status);
    }

    public function test_generator_failure_sets_a_safe_failure_without_partial_roadmap(): void
    {
        $request = $this->generationRequest(User::factory()->create());
        $this->app->instance(RoadmapGenerator::class, new class implements RoadmapGenerator
        {
            public function generate(array $snapshot): array
            {
                throw new RuntimeException('Sensitive local generator detail.');
            }
        });

        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);

        $request->refresh();
        self::assertSame(GenerationRequestStatus::Failed, $request->status);
        self::assertSame('roadmap_generation_failed', $request->failure_code);
        self::assertNull($request->failure_message);
        self::assertNull($request->roadmap_id);
        self::assertNull($request->active_slot);
        self::assertNotNull($request->started_at);
        self::assertNotNull($request->completed_at);
        self::assertDatabaseCount('roadmaps', 0);
    }

    public function test_invalid_generated_structure_and_cycles_are_rejected_before_persistence(): void
    {
        $request = $this->generationRequest(User::factory()->create());
        $this->app->instance(RoadmapGenerator::class, new class implements RoadmapGenerator
        {
            public function generate(array $snapshot): array
            {
                return ['stages' => []];
            }
        });

        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);

        $request->refresh();
        self::assertSame(GenerationRequestStatus::Failed, $request->status);
        self::assertSame('invalid_generated_roadmap', $request->failure_code);
        self::assertDatabaseCount('roadmaps', 0);
        self::assertDatabaseCount('stages', 0);
        self::assertDatabaseCount('tasks', 0);

        $generated = (new FakeRoadmapGenerator)->generate($this->snapshot());
        $generated['stages'][0]['tasks'][0]['dependencies'] = ['stage-3-task-3'];

        $this->expectException(InvalidGeneratedRoadmapException::class);
        $this->expectExceptionMessage('cycle');
        $this->app->make(ValidateGeneratedRoadmap::class)->execute($generated);
    }

    public function test_get_roadmap_returns_the_complete_owned_tree_and_hides_foreign_roadmaps(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $request = $this->generationRequest($owner);
        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);
        $roadmapId = (string) $request->refresh()->roadmap_id;

        $this->withJwt($owner)->getJson('/api/v1/roadmaps/'.$roadmapId)
            ->assertOk()
            ->assertJsonPath('data.id', $roadmapId)
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.current_version.status', 'current')
            ->assertJsonCount(3, 'data.current_version.stages')
            ->assertJsonCount(3, 'data.current_version.stages.0.tasks')
            ->assertJsonStructure([
                'data' => ['id', 'goal', 'status', 'current_version' => [
                    'id', 'version_number', 'source', 'status', 'stages' => [[
                        'id', 'title', 'description', 'position', 'status', 'estimated_minutes', 'tasks' => [[
                            'id', 'type', 'title', 'instructions', 'position', 'status', 'is_required',
                            'estimated_minutes', 'depends_on_task_ids',
                        ]],
                    ]],
                ]],
                'meta' => ['request_id'],
            ]);

        $this->withJwt($other)->getJson('/api/v1/roadmaps/'.$roadmapId)
            ->assertNotFound()->assertJsonPath('error.code', 'roadmap_not_found');
        $this->withHeader('Authorization', '')->getJson('/api/v1/roadmaps/'.$roadmapId)->assertUnauthorized();
    }

    private function generationRequest(User $user): RoadmapGenerationRequest
    {
        return RoadmapGenerationRequest::factory()->for($user)->create([
            'input_snapshot' => $this->snapshot(),
        ]);
    }

    private function completeUser(): User
    {
        $user = User::factory()->create();
        UserPreference::factory()
            ->for($user)->create(['resource_language' => 'ar']);
        LearningProfile::factory()
            ->for($user)->create();

        return $user->refresh();
    }

    /** @return array<string, mixed> */
    private function snapshot(): array
    {
        return [
            'schema_version' => 1,
            'learning_profile' => [
                'goal' => 'Learn backend architecture',
                'self_assessed_level' => 'some_experience',
                'desired_outcome' => 'Ship a maintainable service',
                'available_minutes_per_week' => 360,
                'preferred_learning_methods' => ['hands_on_projects', 'reading_docs'],
            ],
            'preferences' => ['resource_language' => 'ar'],
        ];
    }
}
