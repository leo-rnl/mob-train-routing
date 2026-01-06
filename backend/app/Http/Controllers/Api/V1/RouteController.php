<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\RouteRepositoryInterface;
use App\Contracts\RouteServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreRouteRequest;
use App\Http\Resources\RouteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RouteController extends Controller
{
    public function __construct(
        private readonly RouteServiceInterface $routeService,
        private readonly RouteRepositoryInterface $routeRepository
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min((int) $request->query('per_page', '10'), 100);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $routes = $this->routeRepository->findByUserPaginated($user->id, $perPage);

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

        $route = $this->routeService->calculateAndStore(
            $from,
            $to,
            $analyticCode,
            $request->user()?->id
        );

        if ($route === null) {
            return response()->json([
                'message' => 'Aucun chemin n\'existe entre les stations spécifiées.',
                'errors' => [
                    'route' => ['Aucun chemin n\'existe entre les stations spécifiées.'],
                ],
            ], 422);
        }

        return (new RouteResource($route))
            ->response()
            ->setStatusCode(201);
    }
}
