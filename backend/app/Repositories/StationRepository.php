<?php

namespace App\Repositories;

use App\Contracts\StationRepositoryInterface;
use App\Models\Station;
use Illuminate\Support\Collection;

class StationRepository implements StationRepositoryInterface
{
    /**
     * @inheritDoc
     */
    public function search(?string $term, bool $connectedOnly): Collection
    {
        return Station::query()
            ->when($term, fn ($q, $s) => $q->search($s))
            ->when($connectedOnly, fn ($q) => $q->connected())
            ->orderBy('long_name')
            ->get();
    }
}
