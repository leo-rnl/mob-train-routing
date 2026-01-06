<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface StationRepositoryInterface
{
    /**
     * Search stations with optional filters.
     *
     * @return Collection<int, \App\Models\Station>
     */
    public function search(?string $term, bool $connectedOnly): Collection;
}
