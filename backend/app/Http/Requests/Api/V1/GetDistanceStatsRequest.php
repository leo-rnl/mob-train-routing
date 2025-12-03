<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GetDistanceStatsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'from' => ['sometimes', 'nullable', 'date', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'nullable', 'date', 'date_format:Y-m-d', 'after_or_equal:from'],
            'groupBy' => ['sometimes', 'nullable', Rule::in(['none', 'day', 'month', 'year'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'to.after_or_equal' => 'The end date must be after or equal to the start date.',
            'groupBy.in' => 'The groupBy field must be one of: none, day, month, year.',
        ];
    }
}
