<?php

namespace Tests\Feature\Api\V1;

use App\Models\Station;
use App\Models\User;
use App\Services\GraphService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/stations');

        $response->assertStatus(401);
    }

    public function test_returns_connected_stations_by_default(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'items' => [
                    '*' => ['id', 'shortName', 'longName'],
                ],
            ]);

        $firstItem = $response->json('items.0');
        $this->assertArrayHasKey('shortName', $firstItem);
        $this->assertArrayHasKey('longName', $firstItem);
    }

    public function test_filters_stations_by_search_on_short_name(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stations?search=MX');

        $response->assertStatus(200);

        $items = $response->json('items');
        foreach ($items as $item) {
            $matchesShort = stripos($item['shortName'], 'MX') !== false;
            $matchesLong = stripos($item['longName'], 'MX') !== false;
            $this->assertTrue($matchesShort || $matchesLong);
        }
    }

    public function test_filters_stations_by_search_on_long_name(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stations?search=Montreux');

        $response->assertStatus(200);

        $items = $response->json('items');
        $this->assertNotEmpty($items);
    }

    public function test_connected_false_returns_all_stations(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $allStationsCount = Station::count();

        $response = $this->getJson('/api/v1/stations?connected=false');

        $response->assertStatus(200);
        $this->assertCount($allStationsCount, $response->json('items'));
    }

    public function test_connected_true_returns_only_graph_stations(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/stations?connected=true');

        $response->assertStatus(200);

        $graphService = app(GraphService::class);
        $graphService->loadGraph();

        foreach ($response->json('items') as $item) {
            $this->assertTrue($graphService->hasStation($item['shortName']));
        }
    }

    public function test_search_is_case_insensitive(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $responseUpper = $this->getJson('/api/v1/stations?search=MX');
        $responseLower = $this->getJson('/api/v1/stations?search=mx');

        $this->assertEquals(
            count($responseUpper->json('items')),
            count($responseLower->json('items'))
        );
    }

    public function test_empty_search_returns_all_connected(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $responseWithSearch = $this->getJson('/api/v1/stations?search=');
        $responseWithoutSearch = $this->getJson('/api/v1/stations');

        $this->assertEquals(
            count($responseWithSearch->json('items')),
            count($responseWithoutSearch->json('items'))
        );
    }
}
