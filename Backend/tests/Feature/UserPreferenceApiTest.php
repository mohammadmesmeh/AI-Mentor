<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class UserPreferenceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_read_or_update_preferences(): void
    {
        $this->getJson('/api/v1/me/preferences')->assertUnauthorized();
        $this->patchJson('/api/v1/me/preferences', ['timezone' => 'UTC'])->assertUnauthorized();
    }

    public function test_user_reads_only_their_preferences_through_the_public_resource(): void
    {
        $user = User::factory()->create();
        $preference = UserPreference::factory()->for($user)->create([
            'ui_locale' => UiLocale::Arabic,
            'resource_language' => ResourceLanguage::English,
            'timezone' => 'Asia/Hebron',
        ]);
        UserPreference::factory()->create(['timezone' => 'Europe/London']);

        $response = $this->withJwt($user)->getJson('/api/v1/me/preferences')
            ->assertOk()
            ->assertJsonPath('data.ui_locale', 'ar')
            ->assertJsonPath('data.resource_language', 'en')
            ->assertJsonPath('data.timezone', 'Asia/Hebron')
            ->assertJsonMissingPath('data.id')
            ->assertJsonMissingPath('data.user_id')
            ->assertJsonMissingPath('data.created_at')
            ->assertJsonStructure(['data' => ['ui_locale', 'resource_language', 'timezone', 'updated_at'], 'meta' => ['request_id']]);

        self::assertSame($preference->id, $user->preference()->firstOrFail()->id);
        $this->assertValidRequestId($response->json('meta.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_missing_legacy_preferences_return_404_without_writing_on_get(): void
    {
        $user = User::factory()->create();

        $response = $this->withJwt($user)->getJson('/api/v1/me/preferences')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'user_preferences_not_found');

        $this->assertDatabaseCount('user_preferences', 0);
        $this->assertValidRequestId($response->json('meta.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_partial_update_preserves_omitted_fields_and_other_users_preferences(): void
    {
        $user = User::factory()->create();
        $preference = UserPreference::factory()->for($user)->create([
            'ui_locale' => UiLocale::English,
            'resource_language' => ResourceLanguage::Both,
            'timezone' => 'UTC',
        ]);
        $otherPreference = UserPreference::factory()->create(['timezone' => 'Europe/London']);

        $this->withJwt($user)->patchJson('/api/v1/me/preferences', [
            'timezone' => 'Asia/Hebron',
        ])->assertOk()
            ->assertJsonPath('data.ui_locale', 'en')
            ->assertJsonPath('data.resource_language', 'both')
            ->assertJsonPath('data.timezone', 'Asia/Hebron');

        $preference->refresh();
        self::assertSame(UiLocale::English, $preference->ui_locale);
        self::assertSame(ResourceLanguage::Both, $preference->resource_language);
        self::assertSame('Asia/Hebron', $preference->timezone);
        self::assertSame('Europe/London', $otherPreference->refresh()->timezone);
    }

    public function test_all_supported_preferences_can_be_updated(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();

        $this->withJwt($user)->patchJson('/api/v1/me/preferences', [
            'ui_locale' => UiLocale::Arabic->value,
            'resource_language' => ResourceLanguage::Arabic->value,
            'timezone' => 'America/Toronto',
        ])->assertOk()
            ->assertJsonPath('data.ui_locale', 'ar')
            ->assertJsonPath('data.resource_language', 'ar')
            ->assertJsonPath('data.timezone', 'America/Toronto');
    }

    public function test_invalid_enums_timezone_and_internal_fields_are_rejected_without_changes(): void
    {
        $user = User::factory()->create();
        $preference = UserPreference::factory()->for($user)->create();

        $this->withJwt($user)->patchJson('/api/v1/me/preferences', [
            'ui_locale' => 'fr',
            'resource_language' => 'de',
            'timezone' => 'Not/A_Real_Timezone',
            'user_id' => User::factory()->create()->id,
            'id' => (string) Str::ulid(),
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['details' => [
                'ui_locale',
                'resource_language',
                'timezone',
                'user_id',
                'id',
                'created_at',
                'updated_at',
            ]]]);

        self::assertSame('UTC', $preference->refresh()->timezone);
        self::assertSame($user->id, $preference->user_id);
    }

    public function test_empty_preference_patch_is_rejected(): void
    {
        $user = User::factory()->create();
        UserPreference::factory()->for($user)->create();

        $this->withJwt($user)->patchJson('/api/v1/me/preferences')
            ->assertUnprocessable()
            ->assertJsonStructure(['error' => ['details' => ['preferences']]]);
    }

    private function assertValidRequestId(mixed $requestId, ?string $header): void
    {
        self::assertIsString($requestId);
        self::assertTrue(Str::isUlid($requestId));
        self::assertSame($requestId, $header);
    }
}
