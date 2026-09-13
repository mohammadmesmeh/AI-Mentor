<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Identity\Application\Actions\AuthenticateAccessToken;
use App\Modules\Identity\Application\Contracts\AccessTokenService;
use App\Modules\Identity\Application\Contracts\TokenRevocationStore;
use App\Modules\Identity\Infrastructure\Security\Jwt\JwtRequestGuard;
use App\Modules\Identity\Infrastructure\Security\Jwt\LcobucciAccessTokenService;
use App\Modules\Identity\Infrastructure\Security\RedisTokenRevocationStore;
use App\Modules\Roadmap\Application\Contracts\RoadmapGenerator;
use App\Modules\Roadmap\Application\Policies\RoadmapPolicy;
use App\Modules\Roadmap\Infrastructure\Generation\FakeRoadmapGenerator;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AccessTokenService::class, LcobucciAccessTokenService::class);
        $this->app->singleton(TokenRevocationStore::class, RedisTokenRevocationStore::class);
        $this->app->singleton(RoadmapGenerator::class, FakeRoadmapGenerator::class);
    }

    public function boot(): void
    {
        Gate::policy(Roadmap::class, RoadmapPolicy::class);

        Auth::extend('jwt', static function ($app, string $name, array $config): JwtRequestGuard {
            $guard = new JwtRequestGuard(
                static fn (Request $request) => $app->make(AuthenticateAccessToken::class)->execute($request),
                $app['request'],
                $app['auth']->createUserProvider($config['provider'] ?? null),
            );
            $app->refresh('request', $guard, 'setRequest');

            return $guard;
        });

        RateLimiter::for('identity.login', static function (Request $request): Limit {
            $email = Str::lower(trim((string) $request->input('email', '')));

            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('identity.register', static fn (Request $request): Limit => Limit::perMinute(3)
            ->by((string) $request->ip()));

        RateLimiter::for('roadmap-generation.create', static fn (Request $request): Limit => Limit::perMinute(3)
            ->by((string) ($request->user('jwt')?->getAuthIdentifier() ?? $request->ip())));

        RateLimiter::for('identity.refresh', static fn (Request $request): Limit => Limit::perMinute(10)
            ->by((string) $request->ip()));
    }
}
