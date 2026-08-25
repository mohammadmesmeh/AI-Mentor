<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Roadmap\Application\Policies\RoadmapPolicy;
use App\Modules\Roadmap\Infrastructure\Persistence\Models\Roadmap;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Roadmap::class, RoadmapPolicy::class);
    }
}
