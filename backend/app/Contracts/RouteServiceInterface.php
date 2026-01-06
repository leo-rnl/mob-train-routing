<?php

namespace App\Contracts;

use App\Models\Route;

interface RouteServiceInterface
{
    /**
     * Calculate the shortest path and store the route.
     *
     * @return Route|null Returns null if no path exists
     */
    public function calculateAndStore(
        string $fromStationId,
        string $toStationId,
        string $analyticCode,
        ?int $userId
    ): ?Route;
}
