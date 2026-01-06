<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\StatsServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GetDistanceStatsRequest;
use App\Http\Resources\DistanceStatCollection;

class StatsController extends Controller
{
    public function __construct(
        private readonly StatsServiceInterface $statsService
    ) {
    }

    public function distances(GetDistanceStatsRequest $request): DistanceStatCollection
    {
        /** @var string|null $from */
        $from = $request->validated('from');
        /** @var string|null $to */
        $to = $request->validated('to');
        /** @var string $groupBy */
        $groupBy = $request->validated('groupBy') ?? 'none';

        $stats = $this->statsService->getDistanceStats($from, $to, $groupBy);

        return new DistanceStatCollection($stats, $from, $to, $groupBy);
    }
}
