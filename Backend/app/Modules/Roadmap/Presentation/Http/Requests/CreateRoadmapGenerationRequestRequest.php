<?php

declare(strict_types=1);

namespace App\Modules\Roadmap\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class CreateRoadmapGenerationRequestRequest extends FormRequest
{
    /** @var list<string> */
    private array $submittedBodyFields = [];

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'min:8', 'max:128', 'regex:/\A[A-Za-z0-9][A-Za-z0-9._:-]*\z/'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach ($this->submittedBodyFields as $field) {
                $validator->errors()->add($field, 'Request body fields are not allowed.');
            }
        }];
    }

    public function idempotencyKey(): string
    {
        return (string) $this->validated('idempotency_key');
    }

    protected function prepareForValidation(): void
    {
        $this->submittedBodyFields = array_keys($this->request->all());
        $this->merge(['idempotency_key' => $this->header('Idempotency-Key')]);
    }
}
