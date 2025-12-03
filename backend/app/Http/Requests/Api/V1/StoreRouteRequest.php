<?php

namespace App\Http\Requests\Api\V1;

use App\Services\GraphService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRouteRequest extends FormRequest
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
            'fromStationId' => ['required', 'string', 'max:10'],
            'toStationId' => ['required', 'string', 'max:10'],
            'analyticCode' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'fromStationId.required' => 'The origin station is required.',
            'toStationId.required' => 'The destination station is required.',
            'analyticCode.required' => 'The analytic code is required.',
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $graphService = app(GraphService::class);
                $graphService->loadGraph();

                /** @var string $from */
                $from = $this->input('fromStationId');
                /** @var string $to */
                $to = $this->input('toStationId');

                if (!$graphService->hasStation($from)) {
                    $validator->errors()->add('fromStationId', "Station '{$from}' is not in the network.");
                }

                if (!$graphService->hasStation($to)) {
                    $validator->errors()->add('toStationId', "Station '{$to}' is not in the network.");
                }
            },
        ];
    }
}
