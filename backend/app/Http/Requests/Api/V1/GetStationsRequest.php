<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class GetStationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'connected' => ['sometimes', 'nullable'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('connected')) {
            $this->merge([
                'connected' => filter_var(
                    $this->input('connected'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ) ?? true,
            ]);
        }
    }
}
