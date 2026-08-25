<?php

declare(strict_types=1);

namespace App\Modules\Identity\Presentation\Http\Requests;

use App\Modules\Identity\Domain\Enums\ResourceLanguage;
use App\Modules\Identity\Domain\Enums\UiLocale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpdateUserPreferenceRequest extends FormRequest
{
    /** @var list<string> */
    private const ALLOWED_FIELDS = ['ui_locale', 'resource_language', 'timezone'];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'ui_locale' => ['sometimes', 'string', Rule::enum(UiLocale::class)],
            'resource_language' => ['sometimes', 'string', Rule::enum(ResourceLanguage::class)],
            'timezone' => ['sometimes', 'string', 'max:64', 'timezone:all'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $submittedFields = array_keys($this->all());

            foreach (array_diff($submittedFields, self::ALLOWED_FIELDS) as $field) {
                $validator->errors()->add($field, 'This field is not allowed.');
            }

            if (array_intersect($submittedFields, self::ALLOWED_FIELDS) === []) {
                $validator->errors()->add('preferences', 'At least one preference must be provided.');
            }
        }];
    }
}
