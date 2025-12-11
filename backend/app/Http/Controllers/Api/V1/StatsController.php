<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GetDistanceStatsRequest;
use App\Http\Resources\DistanceStatCollection;
use App\Models\Route;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function distances(GetDistanceStatsRequest $request): DistanceStatCollection
    {
        /** @var string|null $from */
        $from = $request->validated('from');
        /** @var string|null $to */
        $to = $request->validated('to');
        /** @var string $groupBy */
        $groupBy = $request->validated('groupBy') ?? 'none';

        $query = Route::query()
            ->when($from, fn (Builder $q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn (Builder $q) => $q->whereDate('created_at', '<=', $to));

        // SQLite (tests) - early return
        if (DB::connection()->getDriverName() === 'sqlite') {
            return $this->executeStatsQuery($query, $groupBy, $from, $to, useSqlite: true);
        }

        // PostgreSQL (production)
        return $this->executeStatsQuery($query, $groupBy, $from, $to, useSqlite: false);
    }

    /**
     * @param Builder<Route> $query
     */
    private function executeStatsQuery(
        Builder $query,
        string $groupBy,
        ?string $from,
        ?string $to,
        bool $useSqlite
    ): DistanceStatCollection {
        $selectColumns = [
            'analytic_code',
            DB::raw('SUM(distance_km) as total_distance_km'),
        ];

        $groupByColumns = ['analytic_code'];

        if ($groupBy !== 'none') {
            [$selectCols, $groupCols] = $useSqlite
                ? $this->getGroupingSqlite($groupBy)
                : $this->getGroupingPostgres($groupBy);

            $selectColumns = array_merge($selectColumns, $selectCols);
            $groupByColumns = array_merge($groupByColumns, $groupCols);
        }

        $stats = $query
            ->select($selectColumns)
            ->groupBy($groupByColumns)
            ->orderBy('analytic_code')
            ->get()
            ->toArray();

        return new DistanceStatCollection($stats, $from, $to, $groupBy);
    }

    /**
     * Get SQLite-specific grouping columns.
     *
     * @return array{0: list<mixed>, 1: list<mixed>}
     */
    private function getGroupingSqlite(string $groupBy): array
    {
        return match ($groupBy) {
            'day' => [
                [
                    DB::raw("strftime('%Y-%m-%d', created_at) as \"group\""),
                    DB::raw("date(created_at) as period_start"),
                    DB::raw("date(created_at) as period_end"),
                ],
                [DB::raw("strftime('%Y-%m-%d', created_at)")],
            ],
            'month' => [
                [
                    DB::raw("strftime('%Y-%m', created_at) as \"group\""),
                    DB::raw("date(created_at, 'start of month') as period_start"),
                    DB::raw("date(created_at, 'start of month', '+1 month', '-1 day') as period_end"),
                ],
                [DB::raw("strftime('%Y-%m', created_at)")],
            ],
            'year' => [
                [
                    DB::raw("strftime('%Y', created_at) as \"group\""),
                    DB::raw("date(created_at, 'start of year') as period_start"),
                    DB::raw("date(created_at, 'start of year', '+1 year', '-1 day') as period_end"),
                ],
                [DB::raw("strftime('%Y', created_at)")],
            ],
            default => [[], []],
        };
    }

    /**
     * Get PostgreSQL-specific grouping columns.
     *
     * @return array{0: list<mixed>, 1: list<mixed>}
     */
    private function getGroupingPostgres(string $groupBy): array
    {
        return match ($groupBy) {
            'day' => [
                [
                    DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') as \"group\""),
                    DB::raw("DATE(created_at) as period_start"),
                    DB::raw("DATE(created_at) as period_end"),
                ],
                [
                    DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD')"),
                    DB::raw("DATE(created_at)"),
                ],
            ],
            'month' => [
                [
                    DB::raw("TO_CHAR(created_at, 'YYYY-MM') as \"group\""),
                    DB::raw("DATE_TRUNC('month', created_at)::date as period_start"),
                    DB::raw(
                        "(DATE_TRUNC('month', created_at) + INTERVAL '1 month' - INTERVAL '1 day')::date as period_end"
                    ),
                ],
                [
                    DB::raw("TO_CHAR(created_at, 'YYYY-MM')"),
                    DB::raw("DATE_TRUNC('month', created_at)"),
                ],
            ],
            'year' => [
                [
                    DB::raw("TO_CHAR(created_at, 'YYYY') as \"group\""),
                    DB::raw("DATE_TRUNC('year', created_at)::date as period_start"),
                    DB::raw(
                        "(DATE_TRUNC('year', created_at) + INTERVAL '1 year' - INTERVAL '1 day')::date as period_end"
                    ),
                ],
                [
                    DB::raw("TO_CHAR(created_at, 'YYYY')"),
                    DB::raw("DATE_TRUNC('year', created_at)"),
                ],
            ],
            default => [[], []],
        };
    }
}
