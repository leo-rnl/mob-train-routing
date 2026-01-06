<?php

namespace App\Contracts;

use App\Models\Route;
use Illuminate\Pagination\LengthAwarePaginator;

interface RouteRepositoryInterface
{
    /**
     * Create a new route.
     *
     * @param array{
     *     user_id: int|null,
     *     from_station_id: string,
     *     to_station_id: string,
     *     analytic_code: string,
     *     distance_km: float,
     *     path: array<string>
     * } $data
     */
    public function create(array $data): Route;

    /**
     * Get paginated routes for a user.
     *
     * @return LengthAwarePaginator<int, Route>
     */
    public function findByUserPaginated(int $userId, int $perPage = 10): LengthAwarePaginator;
}
