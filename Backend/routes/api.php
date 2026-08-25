<?php

declare(strict_types=1);

use App\Modules\Identity\Presentation\Http\Controllers\LoginController;
use App\Modules\Identity\Presentation\Http\Controllers\LogoutController;
use App\Modules\Identity\Presentation\Http\Controllers\MeController;
use App\Modules\Identity\Presentation\Http\Controllers\RegisterController;
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
        ->middleware('auth:sanctum')
        ->name('logout');
});

Route::middleware('auth:sanctum')->get('/me', MeController::class)->name('api.v1.me');
