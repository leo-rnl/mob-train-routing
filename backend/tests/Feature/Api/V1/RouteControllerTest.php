<?php

namespace Tests\Feature\Api\V1;

use App\Models\Route;
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

    public function test_index_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/routes');

        $response->assertStatus(401);
    }

    public function test_index_returns_user_routes(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Route::create([
            'user_id' => $user->id,
            'from_station_id' => 'MX',
            'to_station_id' => 'CGE',
            'analytic_code' => 'TEST-001',
            'distance_km' => 2.45,
            'path' => ['MX', 'CGE'],
        ]);

        $response = $this->getJson('/api/v1/routes');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fromStationId', 'MX')
            ->assertJsonPath('data.0.toStationId', 'CGE');
    }

    public function test_index_returns_empty_for_new_user(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/v1/routes');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_index_respects_pagination(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        for ($i = 0; $i < 15; $i++) {
            Route::create([
                'user_id' => $user->id,
                'from_station_id' => 'MX',
                'to_station_id' => 'CGE',
                'analytic_code' => "TEST-{$i}",
                'distance_km' => 2.45,
                'path' => ['MX', 'CGE'],
            ]);
        }

        $response = $this->getJson('/api/v1/routes?per_page=5');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_index_does_not_return_other_users_routes(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        Route::create([
            'user_id' => $user1->id,
            'from_station_id' => 'MX',
            'to_station_id' => 'CGE',
            'analytic_code' => 'USER1-ROUTE',
            'distance_km' => 2.45,
            'path' => ['MX', 'CGE'],
        ]);

        Sanctum::actingAs($user2);

        $response = $this->getJson('/api/v1/routes');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_index_orders_by_created_at_desc(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $older = Route::create([
            'user_id' => $user->id,
            'from_station_id' => 'MX',
            'to_station_id' => 'CGE',
            'analytic_code' => 'OLDER',
            'distance_km' => 2.45,
            'path' => ['MX', 'CGE'],
        ]);
        $older->created_at = now()->subHour();
        $older->save();

        $newer = Route::create([
            'user_id' => $user->id,
            'from_station_id' => 'CGE',
            'to_station_id' => 'MX',
            'analytic_code' => 'NEWER',
            'distance_km' => 2.45,
            'path' => ['CGE', 'MX'],
        ]);

        $response = $this->getJson('/api/v1/routes');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.analyticCode', 'NEWER')
            ->assertJsonPath('data.1.analyticCode', 'OLDER');
    }
}
