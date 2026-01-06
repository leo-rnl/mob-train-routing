<?php

namespace App\Services;

use App\Contracts\GraphServiceInterface;
use App\Contracts\RouteRepositoryInterface;
use App\Contracts\RouteServiceInterface;
use App\Models\Route;

class RouteService implements RouteServiceInterface
{
    public function __construct(
        private readonly GraphServiceInterface $graphService,
        private readonly RouteRepositoryInterface $routeRepository
    ) {
    }

    /**
     * @inheritDoc
     */
    public function calculateAndStore(
        string $fromStationId,
        string $toStationId,
        string $analyticCode,
        ?int $userId
    ): ?Route {
        $this->graphService->loadGraph();
        $result = $this->graphService->findShortestPath($fromStationId, $toStationId);

        if ($result === null) {
            return null;
        }

        return $this->routeRepository->create([
            'user_id' => $userId,
            'from_station_id' => $fromStationId,
            'to_station_id' => $toStationId,
            'analytic_code' => $analyticCode,
            'distance_km' => $result['distance'],
            'path' => $result['path'],
        ]);
    }
}
