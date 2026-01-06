<?php

namespace App\Contracts;

use App\Models\Distance;
use Illuminate\Database\Eloquent\Collection;

interface DistanceRepositoryInterface
{
    /**
     * Get all distances for building the graph.
     *
     * @return Collection<int, Distance>
     */
    public function getAllDistances(): Collection;
}
