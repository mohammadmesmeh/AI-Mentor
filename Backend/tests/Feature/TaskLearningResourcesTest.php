<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Roadmap\Application\Actions\ProcessRoadmapGeneration;
use App\Modules\Roadmap\Application\Actions\ValidateGeneratedRoadmap;
use App\Modules\Roadmap\Application\Contracts\RoadmapGenerator;
use App\Modules\Roadmap\Application\Exceptions\InvalidGeneratedRoadmapException;
use App\Modules\Roadmap\Domain\Enums\GenerationRequestStatus;
use App\Modules\Roadmap\Infrastructure\Generation\FakeRoadmapGenerator;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\RoadmapGenerationRequest;
use App\Modules\TaskExecution\Domain\Enums\TaskResourceType;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\Task;
use App\Modules\TaskExecution\Infrastructure\Persistence\Models\TaskResource;
use Database\Seeders\TaskTypeSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

final class TaskLearningResourcesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TaskTypeSeeder::class);
    }

    public function test_resource_validation_rejects_unsafe_invalid_and_duplicate_values(): void
    {
        $invalidResources = [
            [['title' => 'HTTP', 'url' => 'http://laravel.com/docs', 'type' => 'documentation']],
            [['title' => 'Script', 'url' => 'javascript:alert(1)', 'type' => 'documentation']],
            [['title' => 'File', 'url' => 'file:///tmp/docs', 'type' => 'documentation']],
            [['title' => 'Broken', 'url' => 'not-a-url', 'type' => 'documentation']],
            [['title' => 'Unknown', 'url' => 'https://laravel.com/docs', 'type' => 'podcast']],
            [['title' => 'Internal', 'url' => 'https://laravel.com/docs', 'type' => 'documentation', 'id' => 'internal']],
            [
                ['title' => 'One', 'url' => 'https://laravel.com/docs', 'type' => 'documentation'],
                ['title' => 'Duplicate', 'url' => 'https://laravel.com/docs', 'type' => 'article'],
            ],
        ];

        foreach ($invalidResources as $resources) {
            $generated = (new FakeRoadmapGenerator)->generate($this->snapshot());
            $generated['stages'][0]['tasks'][0]['resources'] = $resources;

            try {
                $this->app->make(ValidateGeneratedRoadmap::class)->execute($generated);
                self::fail('The invalid task resource was accepted.');
            } catch (InvalidGeneratedRoadmapException $exception) {
                self::assertNotSame('', $exception->getMessage());
            }
        }
    }

    public function test_invalid_resource_prevents_the_entire_roadmap_from_being_saved(): void
    {
        $request = $this->generationRequest();
        $this->app->instance(RoadmapGenerator::class, new class implements RoadmapGenerator
        {
            public function generate(array $snapshot): array
            {
                $generated = (new FakeRoadmapGenerator)->generate($snapshot);
                $generated['stages'][0]['tasks'][0]['resources'][0]['url'] = 'http://unsafe.example';

                return $generated;
            }
        });

        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);

        self::assertSame(GenerationRequestStatus::Failed, $request->refresh()->status);
        self::assertSame('invalid_generated_roadmap', $request->failure_code);
        $this->assertNoGeneratedTree();
    }

    public function test_resource_persistence_failure_rolls_back_the_entire_roadmap(): void
    {
        $request = $this->generationRequest();
        $event = 'eloquent.creating: '.TaskResource::class;
        Event::listen($event, static function (): never {
            throw new RuntimeException('Simulated resource persistence failure.');
        });

        try {
            $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);
        } finally {
            Event::forget($event);
        }

        self::assertSame(GenerationRequestStatus::Failed, $request->refresh()->status);
        self::assertSame('roadmap_generation_failed', $request->failure_code);
        self::assertNull($request->failure_message);
        $this->assertNoGeneratedTree();
    }

    public function test_resources_are_ordered_and_cascade_when_the_task_is_deleted(): void
    {
        $request = $this->generationRequest();
        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);
        $task = Task::query()->firstOrFail();
        $task->resources()->delete();
        $task->resources()->create([
            'title' => 'Second',
            'url' => 'https://www.php.net/docs.php',
            'type' => TaskResourceType::Documentation,
            'position' => 2,
        ]);
        $task->resources()->create([
            'title' => 'First',
            'url' => 'https://laravel.com/docs',
            'type' => TaskResourceType::Documentation,
            'position' => 1,
        ]);

        self::assertSame([1, 2], $task->resources()->pluck('position')->all());
        self::assertDatabaseCount('task_resources', 10);

        $task->delete();

        self::assertDatabaseMissing('task_resources', ['task_id' => $task->id]);
    }

    public function test_resource_positions_are_unique_within_a_task(): void
    {
        $request = $this->generationRequest();
        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);
        $task = Task::query()->firstOrFail();

        $this->expectException(QueryException::class);
        $task->resources()->create([
            'title' => 'Duplicate position',
            'url' => 'https://www.php.net/docs.php',
            'type' => TaskResourceType::Documentation,
            'position' => 1,
        ]);
    }

    public function test_get_roadmap_returns_an_empty_resource_list_for_a_legacy_task(): void
    {
        $user = User::factory()->create();
        $request = $this->generationRequest($user);
        $this->app->make(ProcessRoadmapGeneration::class)->execute($request->id);
        $task = Task::query()->firstOrFail();
        $task->resources()->delete();

        $this->withJwt($user)->getJson('/api/v1/roadmaps/'.$request->refresh()->roadmap_id)
            ->assertOk()
            ->assertJsonPath('data.current_version.stages.0.tasks.0.resources', []);
    }

    private function generationRequest(?User $user = null): RoadmapGenerationRequest
    {
        return RoadmapGenerationRequest::factory()->for($user ?? User::factory()->create())->create([
            'input_snapshot' => $this->snapshot(),
        ]);
    }

    /** @return array<string, mixed> */
    private function snapshot(): array
    {
        return [
            'schema_version' => 1,
            'learning_profile' => [
                'goal' => 'Learn Laravel backend development',
                'available_minutes_per_week' => 360,
            ],
            'preferences' => ['resource_language' => 'ar'],
        ];
    }

    private function assertNoGeneratedTree(): void
    {
        self::assertDatabaseCount('roadmaps', 0);
        self::assertDatabaseCount('roadmap_versions', 0);
        self::assertDatabaseCount('stages', 0);
        self::assertDatabaseCount('tasks', 0);
        self::assertDatabaseCount('task_resources', 0);
    }
}
