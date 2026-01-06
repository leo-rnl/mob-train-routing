<?php

namespace App\Repositories;

use App\Contracts\DistanceRepositoryInterface;
use App\Models\Distance;
use Illuminate\Database\Eloquent\Collection;

class DistanceRepository implements DistanceRepositoryInterface
{
    /**
     * @inheritDoc
     */
    public function getAllDistances(): Collection
    {
        return Distance::query()
            ->select(['parent_station', 'child_station', 'distance_km'])
            ->get();
    }
}
