<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Identity\Application\Contracts\AccessTokenService;
use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Domain\Enums\UserStatus;
use App\Modules\Identity\Infrastructure\Persistence\Models\RefreshToken;
use App\Modules\Identity\Infrastructure\Persistence\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeaders(['Accept' => 'application/json', 'Origin' => 'http://localhost:3000']);
        $this->clearRegisterLimit('127.0.0.1');
        RateLimiter::clear(md5('identity.refresh127.0.0.1'));
    }

    public function test_registration_atomically_creates_identity_preferences_and_token_pair(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->registrationPayload())
            ->assertCreated()->assertHeader('Cache-Control', 'no-store, private')->assertHeader('Pragma', 'no-cache')
            ->assertJsonPath('data.token_type', 'Bearer')->assertJsonPath('data.expires_in', 900)
            ->assertJsonPath('data.refresh_expires_in', 2592000)
            ->assertJsonPath('data.user.name', 'Ada Lovelace')->assertJsonPath('data.user.email', 'ada@example.com')
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonStructure(['data' => [
                'token_type', 'access_token', 'expires_in', 'refresh_token', 'refresh_expires_in', 'user',
            ], 'meta' => ['request_id']]);

        $user = User::query()->where('email', 'ada@example.com')->firstOrFail();
        $preference = $user->preference()->firstOrFail();
        $refresh = $user->refreshTokens()->firstOrFail();
        $plainRefresh = (string) $response->json('data.refresh_token');
        $claims = $this->app->make(AccessTokenService::class)->verify((string) $response->json('data.access_token'));

        self::assertTrue(Hash::check('correct-password', $user->password));
        self::assertSame(UiLocale::English, $preference->ui_locale);
        self::assertSame(ResourceLanguage::Both, $preference->resource_language);
        self::assertSame('UTC', $preference->timezone);
        self::assertSame($user->id, $claims->userId);
        self::assertSame($refresh->family_id, $claims->familyId);
        self::assertTrue(Str::isUlid($claims->tokenId));
        self::assertNotSame($plainRefresh, $refresh->token_hash);
        self::assertSame(hash('sha256', $plainRefresh), $refresh->token_hash);
        self::assertDatabaseCount('personal_access_tokens', 0);
        self::assertNull($response->headers->get('Set-Cookie'));
    }

    public function test_registration_rolls_back_everything_when_jwt_issuance_fails(): void
    {
        $service = $this->mock(AccessTokenService::class);
        $service->shouldReceive('issue')->once()->andThrow(new RuntimeException('Simulated token failure.'));

        $this->postJson('/api/v1/auth/register', $this->registrationPayload())
            ->assertInternalServerError()->assertJsonPath('error.code', 'internal_error');

        $this->assertDatabaseMissing('users', ['email' => 'ada@example.com']);
        self::assertDatabaseCount('user_preferences', 0);
        self::assertDatabaseCount('refresh_tokens', 0);
    }

    public function test_registration_validation_and_duplicate_normalization_are_preserved(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User', 'email' => ' TAKEN@example.com ',
            'password' => 'correct-password', 'password_confirmation' => 'different-password',
            'timezone' => 'Asia/Hebron',
        ])->assertUnprocessable()->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['details' => ['email', 'password', 'timezone']]]);
    }

    public function test_login_returns_tokens_updates_last_login_and_creates_independent_families(): void
    {
        $user = User::factory()->create([
            'email' => 'case@example.com', 'password' => 'correct-password', 'last_login_at' => null,
        ]);
        $this->clearLoginLimit($user->email);

        $first = $this->postJson('/api/v1/auth/login', [
            'email' => ' CASE@EXAMPLE.COM ', 'password' => 'correct-password',
        ])->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $second = $this->postJson('/api/v1/auth/login', [
            'email' => 'case@example.com', 'password' => 'correct-password',
        ])->assertOk();

        self::assertNotSame($first->json('data.access_token'), $second->json('data.access_token'));
        self::assertNotSame($first->json('data.refresh_token'), $second->json('data.refresh_token'));
        self::assertNotNull($user->refresh()->last_login_at);
        self::assertCount(2, $user->refreshTokens()->distinct()->pluck('family_id'));
        self::assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_invalid_inactive_and_deletion_requested_accounts_share_one_generic_error(): void
    {
        User::factory()->create(['email' => 'wrong@example.com', 'password' => 'correct-password']);
        User::factory()->create(['email' => 'suspended@example.com', 'password' => 'correct-password', 'status' => UserStatus::Suspended]);
        User::factory()->create([
            'email' => 'deletion@example.com', 'password' => 'correct-password',
            'status' => UserStatus::DeletionRequested, 'deletion_requested_at' => now(),
        ]);
        $attempts = [
            ['missing@example.com', 'correct-password'], ['wrong@example.com', 'wrong-password'],
            ['suspended@example.com', 'correct-password'], ['deletion@example.com', 'correct-password'],
        ];
        $errors = [];

        foreach ($attempts as [$email, $password]) {
            $this->clearLoginLimit($email);
            $errors[] = $this->postJson('/api/v1/auth/login', compact('email', 'password'))
                ->assertUnprocessable()->assertJsonPath('error.code', 'validation_failed')
                ->json('error.details.email');
        }

        self::assertCount(1, array_unique($errors, SORT_REGULAR));
    }

    public function test_refresh_rotates_the_token_and_the_replacement_works(): void
    {
        $user = User::factory()->create();
        $initial = $this->issueTokenPair($user);
        $response = $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $initial->refreshToken])
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $old = RefreshToken::query()->where('token_hash', hash('sha256', $initial->refreshToken))->firstOrFail();
        $newPlain = (string) $response->json('data.refresh_token');
        $new = RefreshToken::query()->where('token_hash', hash('sha256', $newPlain))->firstOrFail();

        self::assertNotNull($old->revoked_at);
        self::assertNotNull($old->last_used_at);
        self::assertSame($new->id, $old->replaced_by_id);
        self::assertSame($old->family_id, $new->family_id);
        self::assertNull($new->revoked_at);
        $this->withToken((string) $response->json('data.access_token'))
            ->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $newPlain])->assertOk();
    }

    public function test_reusing_a_rotated_token_revokes_the_entire_family(): void
    {
        $user = User::factory()->create();
        $initial = $this->issueTokenPair($user);
        $rotated = $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $initial->refreshToken])->assertOk();
        $newRefresh = (string) $rotated->json('data.refresh_token');
        $newAccess = (string) $rotated->json('data.access_token');

        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $initial->refreshToken])
            ->assertUnauthorized()->assertJsonPath('error.code', 'unauthenticated')->assertJsonMissingPath('error.details');
        self::assertSame(0, RefreshToken::query()->where('family_id', $initial->access->claims->familyId)
            ->whereNull('revoked_at')->count());
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $newRefresh])->assertUnauthorized();
        $this->withToken($newAccess)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_invalid_refresh_tokens_share_one_generic_error(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);
        RefreshToken::query()->where('family_id', $tokens->access->claims->familyId)
            ->update(['expires_at' => now()->subMinute()]);
        $messages = [];

        foreach ([$tokens->refreshToken, str_repeat('x', 64), substr(str_replace('.', '', $tokens->access->token), 0, 64)] as $candidate) {
            $messages[] = $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $candidate])
                ->assertUnauthorized()->json('error.message');
        }

        self::assertCount(1, array_unique($messages));
    }

    public function test_logout_revokes_access_and_refresh_immediately_without_cookies(): void
    {
        $user = User::factory()->create();
        $tokens = $this->issueTokenPair($user);

        $this->withToken($tokens->access->token)->postJson('/api/v1/auth/logout', [
            'refresh_token' => $tokens->refreshToken,
        ])->assertNoContent()->assertHeaderMissing('Set-Cookie');

        $this->withToken($tokens->access->token)->getJson('/api/v1/me')->assertUnauthorized();
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $tokens->refreshToken])->assertUnauthorized();
        self::assertNotNull(RefreshToken::query()->firstOrFail()->revoked_at);
        self::assertGreaterThan(0, Redis::connection()->ttl(config('jwt.redis_prefix').':jti:'.$tokens->access->claims->tokenId));
        self::assertGreaterThan(0, Redis::connection()->ttl(config('jwt.redis_prefix').':sid:'.$tokens->access->claims->familyId));
    }

    public function test_logout_rejects_a_refresh_token_from_another_family(): void
    {
        $user = User::factory()->create();
        $first = $this->issueTokenPair($user);
        $second = $this->issueTokenPair($user);

        $this->withToken($first->access->token)->postJson('/api/v1/auth/logout', [
            'refresh_token' => $second->refreshToken,
        ])->assertUnauthorized();

        self::assertNull(RefreshToken::query()->where('family_id', $second->access->claims->familyId)->firstOrFail()->revoked_at);
        $this->withToken($first->access->token)->getJson('/api/v1/me')->assertOk();
    }

    public function test_login_register_and_refresh_rate_limits_are_enforced(): void
    {
        $ip = '10.20.30.42';
        $this->withServerVariables(['REMOTE_ADDR' => $ip]);
        $this->clearRegisterLimit($ip);
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $payload = $this->registrationPayload();
            $payload['email'] = "register-{$attempt}@example.com";
            $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
        }
        $payload = $this->registrationPayload();
        $payload['email'] = 'register-4@example.com';
        $this->postJson('/api/v1/auth/register', $payload)->assertTooManyRequests();

        $email = 'rate-login@example.com';
        User::factory()->create(['email' => $email]);
        $this->clearLoginLimit($email, $ip);
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => 'wrong'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => 'wrong'])->assertTooManyRequests();

        RateLimiter::clear(md5('identity.refresh'.$ip));
        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->postJson('/api/v1/auth/refresh', ['refresh_token' => str_repeat('x', 64)])->assertUnauthorized();
        }
        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => str_repeat('x', 64)])->assertTooManyRequests();
    }

    public function test_cors_is_non_credentialed_and_sanctum_route_is_absent(): void
    {
        self::assertFalse(config('cors.supports_credentials'));
        self::assertSame(['api/*'], config('cors.paths'));
        self::assertContains('Authorization', config('cors.allowed_headers'));
        self::assertContains('Idempotency-Key', config('cors.allowed_headers'));
        self::assertNotContains('*', config('cors.allowed_origins'));
        $this->get('/sanctum/csrf-cookie')->assertNotFound()->assertCookieMissing('XSRF-TOKEN');
        $this->call('OPTIONS', '/api/v1/auth/login', server: [
            'HTTP_ORIGIN' => 'http://localhost:3000',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'Authorization, Content-Type',
        ])->assertNoContent()->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->assertHeaderMissing('Access-Control-Allow-Credentials');
    }

    /** @return array<string, string> */
    private function registrationPayload(): array
    {
        return [
            'name' => '  Ada Lovelace  ', 'email' => '  ADA@Example.COM ',
            'password' => 'correct-password', 'password_confirmation' => 'correct-password',
        ];
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
