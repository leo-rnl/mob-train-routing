<?php

namespace Tests\Feature\Api\V1;

use App\Models\Route;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StatsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/stats/distances');

        $response->assertStatus(401);
    }

    public function test_returns_stats_grouped_by_analytic_code(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->createRoute('FRET-001', 10.5, '2025-01-15');
        $this->createRoute('FRET-001', 10.5, '2025-01-16');

        $response = $this->getJson('/api/v1/stats/distances?groupBy=none');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'from',
                'to',
                'groupBy',
                'items' => [
                    '*' => ['analyticCode', 'totalDistanceKm'],
                ],
            ]);

        $items = collect($response->json('items'));
        $fret001 = $items->firstWhere('analyticCode', 'FRET-001');

        $this->assertNotNull($fret001);
        $this->assertEquals(21.0, $fret001['totalDistanceKm']);
    }

    public function test_filters_by_date_range(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->createRoute('TEST-001', 10.0, '2025-01-15');
        $this->createRoute('TEST-001', 5.0, '2025-02-15');

        $response = $this->getJson('/api/v1/stats/distances?from=2025-01-01&to=2025-01-31&groupBy=none');

        $response->assertStatus(200);

        $items = collect($response->json('items'));
        $test001 = $items->firstWhere('analyticCode', 'TEST-001');

        $this->assertEquals(10.0, $test001['totalDistanceKm']);
    }

    public function test_groups_by_day(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->createRoute('DAY-TEST', 10.0, '2025-01-15 10:00:00');
        $this->createRoute('DAY-TEST', 10.0, '2025-01-15 14:00:00');

        $response = $this->getJson('/api/v1/stats/distances?groupBy=day');

        $response->assertStatus(200);
        $this->assertEquals('day', $response->json('groupBy'));

        $items = collect($response->json('items'));
        $dayTest = $items->firstWhere('analyticCode', 'DAY-TEST');

        $this->assertNotNull($dayTest);
        $this->assertEquals('2025-01-15', $dayTest['group']);
        $this->assertEquals(20.0, $dayTest['totalDistanceKm']);
    }

    public function test_groups_by_month(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->createRoute('MONTH-TEST', 15.0, '2025-01-05');
        $this->createRoute('MONTH-TEST', 15.0, '2025-01-25');

        $response = $this->getJson('/api/v1/stats/distances?groupBy=month');

        $response->assertStatus(200);
        $this->assertEquals('month', $response->json('groupBy'));

        $items = collect($response->json('items'));
        $monthTest = $items->firstWhere('analyticCode', 'MONTH-TEST');

        $this->assertNotNull($monthTest);
        $this->assertEquals('2025-01', $monthTest['group']);
        $this->assertEquals(30.0, $monthTest['totalDistanceKm']);
    }

    public function test_groups_by_year(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->createRoute('YEAR-TEST', 100.0, '2025-03-01');

        $response = $this->getJson('/api/v1/stats/distances?groupBy=year');

        $response->assertStatus(200);
        $this->assertEquals('year', $response->json('groupBy'));

        $items = collect($response->json('items'));
        $yearTest = $items->firstWhere('analyticCode', 'YEAR-TEST');

        $this->assertNotNull($yearTest);
        $this->assertEquals('2025', $yearTest['group']);
    }

    public function test_returns_422_for_invalid_group_by(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stats/distances?groupBy=invalid');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['groupBy']);
    }

    public function test_returns_422_for_invalid_date_format(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stats/distances?from=not-a-date');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['from']);
    }

    public function test_returns_empty_items_when_no_routes(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stats/distances?from=2099-01-01&to=2099-12-31&groupBy=none');

        $response->assertStatus(200)
            ->assertJson([
                'items' => [],
            ]);
    }

    public function test_includes_period_start_and_end_in_grouped_results(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->createRoute('PERIOD-TEST', 10.0, '2025-01-15');

        $response = $this->getJson('/api/v1/stats/distances?groupBy=month');

        $response->assertStatus(200);

        $items = collect($response->json('items'));
        $periodTest = $items->firstWhere('analyticCode', 'PERIOD-TEST');

        $this->assertNotNull($periodTest);
        $this->assertEquals('2025-01-01', $periodTest['periodStart']);
        $this->assertEquals('2025-01-31', $periodTest['periodEnd']);
    }

    private function createRoute(string $analyticCode, float $distance, string $createdAt): Route
    {
        $route = new Route();
        $route->from_station_id = 'MX';
        $route->to_station_id = 'CGE';
        $route->analytic_code = $analyticCode;
        $route->distance_km = $distance;
        $route->path = ['MX', 'CGE'];
        $route->created_at = Carbon::parse($createdAt);
        $route->save();

        return $route;
    }
}
