<?php

namespace Tests\Feature\Api\V1;

use App\Models\Station;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RouteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'ZW',
            'analyticCode' => 'TEST-001',
        ]);

        $response->assertStatus(401);
    }

    public function test_calculates_route_between_valid_stations(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'CGE',
            'analyticCode' => 'TEST-001',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'id',
                'fromStationId',
                'toStationId',
                'analyticCode',
                'distanceKm',
                'path',
                'createdAt',
            ]);

        $this->assertEquals('MX', $response->json('fromStationId'));
        $this->assertEquals('CGE', $response->json('toStationId'));
        $this->assertEquals('TEST-001', $response->json('analyticCode'));
        $this->assertIsArray($response->json('path'));
        $this->assertContains('MX', $response->json('path'));
        $this->assertContains('CGE', $response->json('path'));

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $response->json('id')
        );

        $this->assertDatabaseHas('routes', [
            'from_station_id' => 'MX',
            'to_station_id' => 'CGE',
            'analytic_code' => 'TEST-001',
        ]);
    }

    public function test_returns_422_for_unknown_origin_station(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'UNKNOWN',
            'toStationId' => 'CGE',
            'analyticCode' => 'TEST-001',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fromStationId']);
    }

    public function test_returns_422_for_unknown_destination_station(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'UNKNOWN',
            'analyticCode' => 'TEST-001',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['toStationId']);
    }

    public function test_returns_422_when_no_path_exists(): void
    {
        Sanctum::actingAs(User::factory()->create());

        Station::create([
            'short_name' => 'ISOLATED',
            'long_name' => 'Isolated Station',
        ]);

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'ISOLATED',
            'analyticCode' => 'TEST-001',
        ]);

        $response->assertStatus(422);
    }

    public function test_returns_422_for_missing_required_fields(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fromStationId', 'toStationId', 'analyticCode']);
    }

    public function test_returns_422_for_empty_analytic_code(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'CGE',
            'analyticCode' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['analyticCode']);
    }

    public function test_calculates_same_station_route(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'MX',
            'analyticCode' => 'TEST-002',
        ]);

        $response->assertStatus(201);
        $this->assertEquals(0, $response->json('distanceKm'));
        $this->assertEquals(['MX'], $response->json('path'));
    }

    public function test_created_at_is_iso8601_format(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/v1/routes', [
            'fromStationId' => 'MX',
            'toStationId' => 'CGE',
            'analyticCode' => 'TEST-003',
        ]);

        $response->assertStatus(201);

        $createdAt = $response->json('createdAt');
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/',
            $createdAt
        );
    }
}
