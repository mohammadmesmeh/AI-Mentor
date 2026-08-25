<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Roadmap\Application\Policies\RoadmapPolicy;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Roadmap::class, RoadmapPolicy::class);

        RateLimiter::for('identity.login', static function (Request $request): Limit {
            $email = Str::lower(trim((string) $request->input('email', '')));

            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('identity.register', static fn (Request $request): Limit => Limit::perMinute(3)
            ->by((string) $request->ip()));
    }
}
