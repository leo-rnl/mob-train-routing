<?php

namespace App\Http\Resources;

use App\Models\Route;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Route
 */
class RouteResource extends JsonResource
{
    /**
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fromStationId' => $this->from_station_id,
            'toStationId' => $this->to_station_id,
            'analyticCode' => $this->analytic_code,
            'distanceKm' => $this->distance_km,
            'path' => $this->path,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
