<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DistanceStatResource extends JsonResource
{
    /**
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, mixed> $data */
        $data = $this->resource;

        $result = [
            'analyticCode' => $data['analytic_code'],
            'totalDistanceKm' => round((float) $data['total_distance_km'], 2),
        ];

        if (isset($data['period_start'])) {
            $result['periodStart'] = $data['period_start'];
        }

        if (isset($data['period_end'])) {
            $result['periodEnd'] = $data['period_end'];
        }

        if (isset($data['group'])) {
            $result['group'] = $data['group'];
        }

        return $result;
    }
}
