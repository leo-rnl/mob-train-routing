<?php

namespace App\Repositories;

use App\Contracts\RouteRepositoryInterface;
use App\Models\Route;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class RouteRepository implements RouteRepositoryInterface
{
    /**
     * @inheritDoc
     */
    public function create(array $data): Route
    {
        return Route::create($data);
    }

    /**
     * @inheritDoc
     */
    public function findByUserPaginated(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        /** @var User $user */
        $user = User::findOrFail($userId);

        return $user->routes()
            ->with(['fromStation', 'toStation'])
            ->latest()
            ->paginate($perPage);
    }
}
