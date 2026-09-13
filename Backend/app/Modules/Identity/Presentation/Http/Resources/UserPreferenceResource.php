<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Resources;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use App\Modules\Identity\Infrastructure\Persistence\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use LogicException;

final class UserPreferenceResource extends JsonResource
{
    /** @return array{ui_locale: string, resource_language: string, timezone: string, updated_at: ?string} */
    public function toArray(Request $request): array
    {
        /** @var UserPreference $preference */
        $preference = $this->resource;
        $uiLocale = $preference->getAttribute('ui_locale');
        $resourceLanguage = $preference->getAttribute('resource_language');

        if (! $uiLocale instanceof UiLocale || ! $resourceLanguage instanceof ResourceLanguage) {
            throw new LogicException('User preference enum casts are not configured.');
        }

        return [
            'ui_locale' => $uiLocale->value,
            'resource_language' => $resourceLanguage->value,
            'timezone' => (string) $preference->getAttribute('timezone'),
            'updated_at' => $preference->updated_at?->toISOString(),
        ];
    }

    /** @return array{meta: array{request_id: mixed}} */
    public function with(Request $request): array
    {
        return ['meta' => ['request_id' => $request->attributes->get('request_id')]];
    }
}
