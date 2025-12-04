<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreRouteRequest;
use App\Http\Resources\RouteResource;
use App\Models\Route;
use App\Services\GraphService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RouteController extends Controller
{
    public function __construct(
        private readonly GraphService $graphService
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min((int) $request->query('per_page', '10'), 100);

        $routes = Route::query()
            ->where('user_id', $request->user()?->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return RouteResource::collection($routes);
    }

    public function store(StoreRouteRequest $request): RouteResource|JsonResponse
    {
        /** @var string $from */
        $from = $request->validated('fromStationId');
        /** @var string $to */
        $to = $request->validated('toStationId');
        /** @var string $analyticCode */
        $analyticCode = $request->validated('analyticCode');

        $this->graphService->loadGraph();
        $result = $this->graphService->findShortestPath($from, $to);

        if ($result === null) {
            return response()->json([
                'message' => 'No path exists between the specified stations.',
                'errors' => [
                    'route' => ['No path exists between the specified stations.'],
                ],
            ], 422);
        }

        $route = new Route();
        $route->user_id = $request->user()?->id;
        $route->from_station_id = $from;
        $route->to_station_id = $to;
        $route->analytic_code = $analyticCode;
        $route->distance_km = $result['distance'];
        $route->path = $result['path'];
        $route->save();

        return (new RouteResource($route))
            ->response()
            ->setStatusCode(201);
    }
}
