<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Application\Actions\RegisterUser;
use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> */
    private array $spaHeaders = [
        'Accept' => 'application/json',
        'Origin' => 'http://localhost:3000',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->get(
            '/api/v1/_test/session-id',
            static fn (Request $request): array => ['id' => $request->session()->getId()],
        );

        $this->withHeaders($this->spaHeaders);
        $csrfToken = Str::random(40);
        $this->withSession(['_token' => $csrfToken]);
        $this->withHeader('X-CSRF-TOKEN', $csrfToken);
        $this->clearRegisterLimit('127.0.0.1');
    }

    public function test_registration_creates_the_user_and_default_preferences_then_authenticates_the_session(): void
    {
        $oldSessionId = $this->getJson('/api/v1/_test/session-id')->json('id');

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => '  Ada Lovelace  ',
            'email' => '  ADA@Example.COM ',
            'password' => 'correct-password',
            'password_confirmation' => 'correct-password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Ada Lovelace')
            ->assertJsonPath('data.email', 'ada@example.com')
            ->assertJsonPath('data.status', UserStatus::Active->value)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token')
            ->assertJsonMissingPath('data.deletion_requested_at')
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email', 'status', 'email_verified_at', 'last_login_at', 'created_at'],
                'meta' => ['request_id'],
            ]);

        $user = User::query()->where('email', 'ada@example.com')->firstOrFail();
        $preference = $user->preference()->firstOrFail();

        self::assertTrue(Str::isUlid($user->id));
        self::assertTrue(Hash::check('correct-password', $user->password));
        self::assertSame(UiLocale::English, $preference->ui_locale);
        self::assertSame(ResourceLanguage::Both, $preference->resource_language);
        self::assertSame('UTC', $preference->timezone);
        $this->assertAuthenticatedAs($user, 'web');
        self::assertNotSame($oldSessionId, $this->getJson('/api/v1/_test/session-id')->json('id'));
        self::assertSame(0, $user->tokens()->count());
    }

    public function test_registration_validates_confirmation_duplicates_and_disallowed_profile_fields(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => ' TAKEN@example.com ',
            'password' => 'correct-password',
            'password_confirmation' => 'different-password',
            'timezone' => 'Asia/Hebron',
            'ui_locale' => 'ar',
            'resource_language' => 'ar',
            'learning_profile' => ['goal' => 'backend'],
            'roadmap' => ['title' => 'Injected'],
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['details' => [
                'email',
                'password',
                'timezone',
                'ui_locale',
                'resource_language',
                'learning_profile',
                'roadmap',
            ]]]);
    }

    public function test_registration_is_atomic_when_default_preferences_cannot_be_created(): void
    {
        $event = 'eloquent.creating: '.UserPreference::class;
        Event::listen($event, static function (): never {
            throw new RuntimeException('Simulated preference failure.');
        });

        try {
            $this->app->make(RegisterUser::class)->execute([
                'name' => 'Atomic User',
                'email' => 'atomic@example.com',
                'password' => 'correct-password',
            ]);
            self::fail('The simulated preference failure was not thrown.');
        } catch (RuntimeException $exception) {
            self::assertSame('Simulated preference failure.', $exception->getMessage());
        } finally {
            Event::forget($event);
        }

        $this->assertDatabaseMissing('users', ['email' => 'atomic@example.com']);
    }

    public function test_login_normalizes_email_regenerates_the_session_and_updates_last_login(): void
    {
        $user = User::factory()->create([
            'email' => 'case@example.com',
            'password' => 'correct-password',
            'last_login_at' => null,
        ]);
        $this->clearLoginLimit('case@example.com');
        $oldSessionId = $this->getJson('/api/v1/_test/session-id')->json('id');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => '  CASE@EXAMPLE.COM ',
            'password' => 'correct-password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'case@example.com')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.token')
            ->assertJsonStructure(['data' => ['last_login_at'], 'meta' => ['request_id']]);

        $this->assertAuthenticatedAs($user, 'web');
        self::assertNotNull($user->refresh()->last_login_at);
        self::assertNotSame($oldSessionId, $this->getJson('/api/v1/_test/session-id')->json('id'));
        self::assertSame(0, $user->tokens()->count());
    }

    public function test_login_rejects_unknown_fields(): void
    {
        $this->clearLoginLimit('person@example.com');

        $this->postJson('/api/v1/auth/login', [
            'email' => 'person@example.com',
            'password' => 'correct-password',
            'token_name' => 'mobile',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['details' => ['token_name']]]);
    }

    public function test_invalid_inactive_and_deletion_requested_accounts_share_one_generic_error(): void
    {
        User::factory()->create([
            'email' => 'wrong@example.com',
            'password' => 'correct-password',
        ]);
        User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => 'correct-password',
            'status' => UserStatus::Suspended,
        ]);
        User::factory()->create([
            'email' => 'deletion@example.com',
            'password' => 'correct-password',
            'status' => UserStatus::DeletionRequested,
            'deletion_requested_at' => now(),
        ]);

        $attempts = [
            ['missing@example.com', 'correct-password'],
            ['wrong@example.com', 'wrong-password'],
            ['suspended@example.com', 'correct-password'],
            ['deletion@example.com', 'correct-password'],
        ];
        $errors = [];

        foreach ($attempts as [$email]) {
            $this->clearLoginLimit($email);
        }

        foreach ($attempts as [$email, $password]) {
            $response = $this->postJson('/api/v1/auth/login', compact('email', 'password'))
                ->assertUnprocessable()
                ->assertJsonPath('error.code', 'validation_failed')
                ->assertJsonStructure(['error' => ['details' => ['email']]]);

            $errors[] = $response->json('error.details.email');
        }

        self::assertCount(1, array_unique($errors, SORT_REGULAR));
        $this->assertGuest('web');
    }

    public function test_me_returns_the_current_user_and_guests_receive_the_standard_error(): void
    {
        $guestResponse = $this->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'unauthenticated');
        $this->assertValidRequestId($guestResponse->json('meta.request_id'), $guestResponse->headers->get('X-Request-ID'));

        $user = User::factory()->create(['password' => 'correct-password']);
        $this->clearLoginLimit($user->email);
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ])->assertOk();

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');
    }

    public function test_logout_invalidates_the_authenticated_session(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);
        $this->clearLoginLimit($user->email);
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ])->assertOk();
        $authenticatedSessionId = $this->getJson('/api/v1/_test/session-id')->json('id');
        $this->refreshCsrfToken();

        $this->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->assertGuest('web');
        $this->getJson('/api/v1/me')->assertUnauthorized();
        self::assertNotSame($authenticatedSessionId, $this->getJson('/api/v1/_test/session-id')->json('id'));
    }

    public function test_login_rate_limit_is_scoped_to_normalized_email_and_ip(): void
    {
        $email = 'rate-login@example.com';
        $ip = '10.20.30.41';
        User::factory()->create(['email' => $email, 'password' => 'correct-password']);
        $this->withServerVariables(['REMOTE_ADDR' => $ip]);
        $this->clearLoginLimit($email, $ip);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => $attempt % 2 === 0 ? strtoupper($email) : "  {$email}  ",
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => 'wrong-password',
        ])->assertTooManyRequests()->assertJsonPath('error.code', 'too_many_requests');

        $this->assertValidRequestId($response->json('meta.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_registration_rate_limit_is_scoped_to_ip(): void
    {
        $ip = '10.20.30.42';
        $this->withServerVariables(['REMOTE_ADDR' => $ip]);
        $this->clearRegisterLimit($ip);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->postJson('/api/v1/auth/register', [
                'name' => "Rate User {$attempt}",
                'email' => "rate-register-{$attempt}@example.com",
                'password' => 'correct-password',
                'password_confirmation' => 'correct-password',
            ])->assertCreated();

            $this->refreshCsrfToken();
        }

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Rate User Four',
            'email' => 'rate-register-4@example.com',
            'password' => 'correct-password',
            'password_confirmation' => 'correct-password',
        ])->assertTooManyRequests()->assertJsonPath('error.code', 'too_many_requests');

        $this->assertValidRequestId($response->json('meta.request_id'), $response->headers->get('X-Request-ID'));
    }

    public function test_sanctum_csrf_cookie_and_credentialed_cors_are_configured_for_the_spa(): void
    {
        self::assertSame(['web'], config('sanctum.guard'));
        self::assertContains('localhost:3000', config('sanctum.stateful'));
        self::assertTrue(config('cors.supports_credentials'));
        self::assertNotContains('*', config('cors.allowed_origins'));
        self::assertTrue(config('session.http_only'));
        self::assertSame('lax', config('session.same_site'));

        $this->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN')
            ->assertCookie((string) config('session.cookie'));

        $this->call('OPTIONS', '/api/v1/auth/login', server: [
            'HTTP_ORIGIN' => 'http://localhost:3000',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ])->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    private function assertValidRequestId(mixed $requestId, ?string $header): void
    {
        self::assertIsString($requestId);
        self::assertTrue(Str::isUlid($requestId));
        self::assertSame($requestId, $header);
    }

    private function refreshCsrfToken(): void
    {
        $csrfToken = Str::random(40);
        $this->withSession(['_token' => $csrfToken]);
        $this->withHeader('X-CSRF-TOKEN', $csrfToken);
    }

    private function clearLoginLimit(string $email, string $ip = '127.0.0.1'): void
    {
        RateLimiter::clear(md5('identity.login'.Str::lower(trim($email)).'|'.$ip));
    }

    private function clearRegisterLimit(string $ip): void
    {
        RateLimiter::clear(md5('identity.register'.$ip));
    }
}
