<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GetStationsRequest;
use App\Http\Resources\StationCollection;
use App\Models\Station;
use App\Services\GraphService;

class StationController extends Controller
{
    public function __construct(
        private readonly GraphService $graphService
    ) {
    }

    public function index(GetStationsRequest $request): StationCollection
    {
        $query = Station::query();

        /** @var string|null $search */
        $search = $request->validated('search');
        if ($search !== null && $search !== '') {
            $searchLower = strtolower($search);
            $query->where(function ($q) use ($searchLower) {
                $q->whereRaw('LOWER(short_name) LIKE ?', ["%{$searchLower}%"])
                    ->orWhereRaw('LOWER(long_name) LIKE ?', ["%{$searchLower}%"]);
            });
        }

        /** @var bool|null $connected */
        $connected = $request->validated('connected');
        if ($connected === null || $connected === true) {
            $this->graphService->loadGraph();
            $connectedStations = $this->graphService->getStations();
            $query->whereIn('short_name', $connectedStations);
        }

        $stations = $query->orderBy('long_name')->get();

        return new StationCollection($stations);
    }
}
