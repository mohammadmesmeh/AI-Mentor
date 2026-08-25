<?php

declare(strict_types=1);

use App\Modules\Identity\Application\Exceptions\UserPreferenceNotFoundException;
use App\Modules\LearningProfile\Application\Exceptions\LearningProfileNotFoundException;
use App\Modules\Roadmap\Application\Exceptions\OnboardingIncompleteException;
use App\Modules\Roadmap\Application\Exceptions\RoadmapGenerationInProgressException;
use App\Modules\Roadmap\Application\Exceptions\RoadmapGenerationRequestNotFoundException;
use App\Shared\Presentation\Http\Middleware\AssignRequestId;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->prepend(AssignRequestId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(static fn (Request $request): bool => $request->is('api/*'));

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = match (true) {
                $exception instanceof AuthenticationException => 401,
                $exception instanceof ValidationException => 422,
                $exception instanceof AuthorizationException => 403,
                $exception instanceof ModelNotFoundException => 404,
                $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
                default => 500,
            };
            $code = match (true) {
                $exception instanceof LearningProfileNotFoundException => 'learning_profile_not_found',
                $exception instanceof UserPreferenceNotFoundException => 'user_preferences_not_found',
                $exception instanceof OnboardingIncompleteException => 'onboarding_incomplete',
                $exception instanceof RoadmapGenerationInProgressException => 'roadmap_generation_in_progress',
                $exception instanceof RoadmapGenerationRequestNotFoundException => 'roadmap_generation_request_not_found',
                default => match ($status) {
                    401 => 'unauthenticated',
                    403 => 'forbidden',
                    404 => 'not_found',
                    422 => 'validation_failed',
                    429 => 'too_many_requests',
                    default => $status >= 500 ? 'internal_error' : 'request_failed',
                },
            };
            $message = $status >= 500
                ? 'An unexpected error occurred.'
                : ($exception->getMessage() ?: 'The request could not be processed.');
            $error = ['code' => $code, 'message' => $message];

            if ($exception instanceof ValidationException) {
                $error['details'] = $exception->errors();
            }

            if ($exception instanceof OnboardingIncompleteException) {
                $error['details'] = ['missing_fields' => $exception->missingFields];
            }

            if ($exception instanceof RoadmapGenerationInProgressException) {
                $error['details'] = ['generation_request_id' => $exception->generationRequestId];
            }

            return response()->json([
                'error' => $error,
                'meta' => ['request_id' => $request->attributes->get('request_id')],
            ], $status);
        });
    })->create();
