<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\GetDistanceStatsRequest;
use App\Http\Resources\DistanceStatCollection;
use App\Models\Route;
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

        $query = Route::query();

        if ($from !== null) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to !== null) {
            $query->whereDate('created_at', '<=', $to);
        }

        $selectColumns = [
            'analytic_code',
            DB::raw('SUM(distance_km) as total_distance_km'),
        ];

        $groupByColumns = ['analytic_code'];

        $driverName = DB::connection()->getDriverName();

        switch ($groupBy) {
            case 'day':
                if ($driverName === 'sqlite') {
                    $selectColumns[] = DB::raw("strftime('%Y-%m-%d', created_at) as \"group\"");
                    $selectColumns[] = DB::raw("date(created_at) as period_start");
                    $selectColumns[] = DB::raw("date(created_at) as period_end");
                    $groupByColumns[] = DB::raw("strftime('%Y-%m-%d', created_at)");
                } else {
                    $selectColumns[] = DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') as \"group\"");
                    $selectColumns[] = DB::raw("DATE(created_at) as period_start");
                    $selectColumns[] = DB::raw("DATE(created_at) as period_end");
                    $groupByColumns[] = DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD')");
                    $groupByColumns[] = DB::raw("DATE(created_at)");
                }
                break;

            case 'month':
                if ($driverName === 'sqlite') {
                    $selectColumns[] = DB::raw("strftime('%Y-%m', created_at) as \"group\"");
                    $selectColumns[] = DB::raw("date(created_at, 'start of month') as period_start");
                    $periodEndSql = "date(created_at, 'start of month', '+1 month', '-1 day') as period_end";
                    $selectColumns[] = DB::raw($periodEndSql);
                    $groupByColumns[] = DB::raw("strftime('%Y-%m', created_at)");
                } else {
                    $selectColumns[] = DB::raw("TO_CHAR(created_at, 'YYYY-MM') as \"group\"");
                    $selectColumns[] = DB::raw("DATE_TRUNC('month', created_at)::date as period_start");
                    $periodEndSql = "(DATE_TRUNC('month', created_at) + INTERVAL '1 month' - INTERVAL '1 day')::date";
                    $selectColumns[] = DB::raw($periodEndSql . " as period_end");
                    $groupByColumns[] = DB::raw("TO_CHAR(created_at, 'YYYY-MM')");
                    $groupByColumns[] = DB::raw("DATE_TRUNC('month', created_at)");
                }
                break;

            case 'year':
                if ($driverName === 'sqlite') {
                    $selectColumns[] = DB::raw("strftime('%Y', created_at) as \"group\"");
                    $selectColumns[] = DB::raw("date(created_at, 'start of year') as period_start");
                    $periodEndSql = "date(created_at, 'start of year', '+1 year', '-1 day') as period_end";
                    $selectColumns[] = DB::raw($periodEndSql);
                    $groupByColumns[] = DB::raw("strftime('%Y', created_at)");
                } else {
                    $selectColumns[] = DB::raw("TO_CHAR(created_at, 'YYYY') as \"group\"");
                    $selectColumns[] = DB::raw("DATE_TRUNC('year', created_at)::date as period_start");
                    $periodEndSql = "(DATE_TRUNC('year', created_at) + INTERVAL '1 year' - INTERVAL '1 day')::date";
                    $selectColumns[] = DB::raw($periodEndSql . " as period_end");
                    $groupByColumns[] = DB::raw("TO_CHAR(created_at, 'YYYY')");
                    $groupByColumns[] = DB::raw("DATE_TRUNC('year', created_at)");
                }
                break;
        }

        $stats = $query
            ->select($selectColumns)
            ->groupBy($groupByColumns)
            ->orderBy('analytic_code')
            ->get()
            ->toArray();

        return new DistanceStatCollection($stats, $from, $to, $groupBy);
    }
}
