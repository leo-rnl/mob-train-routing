<?php

namespace App\Contracts;

interface StatsServiceInterface
{
    /**
     * Get distance statistics grouped by analytic code.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getDistanceStats(?string $from, ?string $to, string $groupBy): array;
}
