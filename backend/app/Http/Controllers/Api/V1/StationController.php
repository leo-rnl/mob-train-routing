<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\StationRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GetStationsRequest;
use App\Http\Resources\StationCollection;

class StationController extends Controller
{
    public function __construct(
        private readonly StationRepositoryInterface $stationRepository
    ) {
    }

    public function index(GetStationsRequest $request): StationCollection
    {
        /** @var string|null $search */
        $search = $request->validated('search');
        /** @var bool $connected */
        $connected = $request->validated('connected') ?? true;

        $stations = $this->stationRepository->search($search, $connected);

        return new StationCollection($stations);
    }
}
