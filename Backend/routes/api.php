<?php

declare(strict_types=1);

use App\Modules\Identity\Presentation\Http\Controllers\GetUserPreferenceController;
use App\Modules\Identity\Presentation\Http\Controllers\LoginController;
use App\Modules\Identity\Presentation\Http\Controllers\LogoutController;
use App\Modules\Identity\Presentation\Http\Controllers\MeController;
use App\Modules\Identity\Presentation\Http\Controllers\RefreshAuthenticationController;
use App\Modules\Identity\Presentation\Http\Controllers\RegisterController;
use App\Modules\Identity\Presentation\Http\Controllers\UpdateUserPreferenceController;
use App\Modules\LearningProfile\Presentation\Http\Controllers\GetLearningProfileController;
use App\Modules\LearningProfile\Presentation\Http\Controllers\GetOnboardingStatusController;
use App\Modules\LearningProfile\Presentation\Http\Controllers\UpsertLearningProfileController;
use App\Modules\Roadmap\Presentation\Http\Controllers\CreateRoadmapGenerationRequestController;
use App\Modules\Roadmap\Presentation\Http\Controllers\GetRoadmapGenerationRequestController;
use App\Shared\Presentation\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('api.v1.health');

Route::prefix('auth')->name('api.v1.auth.')->group(function (): void {
    Route::post('/register', RegisterController::class)
        ->middleware('throttle:identity.register')
        ->name('register');
    Route::post('/login', LoginController::class)
        ->middleware('throttle:identity.login')
        ->name('login');
    Route::post('/logout', LogoutController::class)
        ->middleware('auth:jwt')
        ->name('logout');
    Route::post('/refresh', RefreshAuthenticationController::class)
        ->middleware('throttle:identity.refresh')
        ->name('refresh');
});

Route::middleware('auth:jwt')->get('/me', MeController::class)->name('api.v1.me');

Route::middleware('auth:jwt')->prefix('me')->name('api.v1.me.')->group(function (): void {
    Route::get('/preferences', GetUserPreferenceController::class)->name('preferences.show');
    Route::patch('/preferences', UpdateUserPreferenceController::class)->name('preferences.update');
    Route::get('/learning-profile', GetLearningProfileController::class)->name('learning-profile.show');
    Route::put('/learning-profile', UpsertLearningProfileController::class)->name('learning-profile.upsert');
    Route::get('/onboarding-status', GetOnboardingStatusController::class)->name('onboarding-status.show');
});

Route::middleware('auth:jwt')->prefix('roadmap-generation-requests')
    ->name('api.v1.roadmap-generation-requests.')
    ->group(function (): void {
        Route::post('/', CreateRoadmapGenerationRequestController::class)
            ->middleware('throttle:roadmap-generation.create')
            ->name('store');
        Route::get('/{generationRequest}', GetRoadmapGenerationRequestController::class)
            ->name('show');
    });
