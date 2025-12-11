<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GetStationsRequest;
use App\Http\Resources\StationCollection;
use App\Models\Station;

class StationController extends Controller
{
    public function index(GetStationsRequest $request): StationCollection
    {
        /** @var string|null $search */
        $search = $request->validated('search');
        /** @var bool $connected */
        $connected = $request->validated('connected') ?? true;

        $stations = Station::query()
            ->when($search, fn ($q, $s) => $q->search($s))
            ->when($connected, fn ($q) => $q->connected())
            ->orderBy('long_name')
            ->get();

        return new StationCollection($stations);
    }
}
