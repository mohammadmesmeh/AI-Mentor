<?php

declare(strict_types=1);

namespace App\Modules\LearningProfile\Presentation\Http\Requests;

use App\Modules\LearningProfile\Domain\Enums\LearningMethod;
use App\Modules\LearningProfile\Domain\Enums\SelfAssessedLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpsertLearningProfileRequest extends FormRequest
{
    /** @var list<string> */
    private const ALLOWED_FIELDS = [
        'goal',
        'self_assessed_level',
        'desired_outcome',
        'available_minutes_per_week',
        'preferred_learning_methods',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'goal' => ['required', 'string', 'max:1000'],
            'self_assessed_level' => ['required', 'string', Rule::enum(SelfAssessedLevel::class)],
            'desired_outcome' => ['required', 'string', 'max:2000'],
            'available_minutes_per_week' => ['required', 'integer', 'min:15', 'max:10080'],
            'preferred_learning_methods' => ['required', 'array', 'list', 'min:1', 'max:4'],
            'preferred_learning_methods.*' => ['required', 'string', 'distinct:strict', Rule::enum(LearningMethod::class)],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (array_diff(array_keys($this->all()), self::ALLOWED_FIELDS) as $field) {
                $validator->errors()->add($field, 'This field is not allowed.');
            }
        }];
    }

    protected function prepareForValidation(): void
    {
        $goal = $this->input('goal');
        $desiredOutcome = $this->input('desired_outcome');

        $this->merge([
            'goal' => is_string($goal) ? trim($goal) : $goal,
            'desired_outcome' => is_string($desiredOutcome) ? trim($desiredOutcome) : $desiredOutcome,
        ]);
    }
}
