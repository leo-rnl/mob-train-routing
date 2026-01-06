<?php

namespace Tests\Unit\Services;

use App\Contracts\DistanceRepositoryInterface;
use App\Services\GraphService;
use Mockery;
use Mockery\MockInterface;
use PHPUnit\Framework\TestCase;

class GraphServiceTest extends TestCase
{
    private GraphService $graphService;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var DistanceRepositoryInterface&MockInterface $mockRepository */
        $mockRepository = Mockery::mock(DistanceRepositoryInterface::class);

        $this->graphService = new GraphService($mockRepository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Test graph with simple linear path: A -> B -> C
     */
    public function test_finds_shortest_path_in_linear_graph(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.0],
            'B' => ['A' => 1.0, 'C' => 2.0],
            'C' => ['B' => 2.0],
        ]);

        $result = $this->graphService->findShortestPath('A', 'C');

        $this->assertNotNull($result);
        $this->assertEquals(3.0, $result['distance']);
        $this->assertEquals(['A', 'B', 'C'], $result['path']);
    }

    /**
     * Test graph with multiple paths - should find shortest
     */
    public function test_finds_shortest_path_when_multiple_paths_exist(): void
    {
        // Graph:
        //   A --1-- B --1-- D
        //   |               |
        //   5               1
        //   |               |
        //   C ------3------ D
        $this->graphService->setGraph([
            'A' => ['B' => 1.0, 'C' => 5.0],
            'B' => ['A' => 1.0, 'D' => 1.0],
            'C' => ['A' => 5.0, 'D' => 3.0],
            'D' => ['B' => 1.0, 'C' => 3.0],
        ]);

        $result = $this->graphService->findShortestPath('A', 'D');

        $this->assertNotNull($result);
        $this->assertEquals(2.0, $result['distance']);
        $this->assertEquals(['A', 'B', 'D'], $result['path']);
    }

    /**
     * Test same origin and destination
     */
    public function test_returns_zero_distance_when_from_equals_to(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.0],
            'B' => ['A' => 1.0],
        ]);

        $result = $this->graphService->findShortestPath('A', 'A');

        $this->assertNotNull($result);
        $this->assertEquals(0.0, $result['distance']);
        $this->assertEquals(['A'], $result['path']);
    }

    /**
     * Test unknown origin station
     */
    public function test_returns_null_when_origin_station_unknown(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.0],
            'B' => ['A' => 1.0],
        ]);

        $result = $this->graphService->findShortestPath('X', 'B');

        $this->assertNull($result);
    }

    /**
     * Test unknown destination station
     */
    public function test_returns_null_when_destination_station_unknown(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.0],
            'B' => ['A' => 1.0],
        ]);

        $result = $this->graphService->findShortestPath('A', 'X');

        $this->assertNull($result);
    }

    /**
     * Test disconnected graph - no path exists
     */
    public function test_returns_null_when_no_path_exists(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.0],
            'B' => ['A' => 1.0],
            'C' => ['D' => 1.0],
            'D' => ['C' => 1.0],
        ]);

        $result = $this->graphService->findShortestPath('A', 'D');

        $this->assertNull($result);
    }

    /**
     * Test getStations returns all station codes
     */
    public function test_get_stations_returns_all_station_codes(): void
    {
        $this->graphService->setGraph([
            'MX' => ['CGE' => 0.65],
            'CGE' => ['MX' => 0.65, 'VUAR' => 0.35],
            'VUAR' => ['CGE' => 0.35],
        ]);

        $stations = $this->graphService->getStations();

        $this->assertCount(3, $stations);
        $this->assertContains('MX', $stations);
        $this->assertContains('CGE', $stations);
        $this->assertContains('VUAR', $stations);
    }

    /**
     * Test hasStation returns true for existing station
     */
    public function test_has_station_returns_true_for_existing_station(): void
    {
        $this->graphService->setGraph([
            'MX' => ['CGE' => 0.65],
            'CGE' => ['MX' => 0.65],
        ]);

        $this->assertTrue($this->graphService->hasStation('MX'));
        $this->assertTrue($this->graphService->hasStation('CGE'));
    }

    /**
     * Test hasStation returns false for non-existing station
     */
    public function test_has_station_returns_false_for_non_existing_station(): void
    {
        $this->graphService->setGraph([
            'MX' => ['CGE' => 0.65],
            'CGE' => ['MX' => 0.65],
        ]);

        $this->assertFalse($this->graphService->hasStation('UNKNOWN'));
    }

    /**
     * Test complex graph similar to MOB network
     */
    public function test_finds_path_in_complex_network(): void
    {
        // Simplified MOB network:
        // MX -> CGE -> VUAR -> CABY -> SDY -> ZW
        //                       |
        //                     BLON (MVR-ce)
        $this->graphService->setGraph([
            'MX' => ['CGE' => 0.65],
            'CGE' => ['MX' => 0.65, 'VUAR' => 0.35],
            'VUAR' => ['CGE' => 0.35, 'CABY' => 2.0],
            'CABY' => ['VUAR' => 2.0, 'SDY' => 2.05, 'BLON' => 0.96],
            'SDY' => ['CABY' => 2.05, 'ZW' => 10.0],
            'ZW' => ['SDY' => 10.0],
            'BLON' => ['CABY' => 0.96],
        ]);

        // Test MX to ZW
        $result = $this->graphService->findShortestPath('MX', 'ZW');

        $this->assertNotNull($result);
        $this->assertEquals(15.05, $result['distance']);
        $this->assertEquals(['MX', 'CGE', 'VUAR', 'CABY', 'SDY', 'ZW'], $result['path']);

        // Test MX to BLON (via CABY junction)
        $result = $this->graphService->findShortestPath('MX', 'BLON');

        $this->assertNotNull($result);
        $this->assertEquals(3.96, $result['distance']);
        $this->assertEquals(['MX', 'CGE', 'VUAR', 'CABY', 'BLON'], $result['path']);
    }

    /**
     * Test distance rounding
     */
    public function test_distance_is_rounded_to_two_decimals(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.111],
            'B' => ['A' => 1.111, 'C' => 2.222],
            'C' => ['B' => 2.222],
        ]);

        $result = $this->graphService->findShortestPath('A', 'C');

        $this->assertNotNull($result);
        $this->assertEquals(3.33, $result['distance']);
    }

    /**
     * Test bidirectional path works in both directions
     */
    public function test_bidirectional_path_works_both_ways(): void
    {
        $this->graphService->setGraph([
            'A' => ['B' => 1.0],
            'B' => ['A' => 1.0, 'C' => 2.0],
            'C' => ['B' => 2.0],
        ]);

        $resultForward = $this->graphService->findShortestPath('A', 'C');
        $resultBackward = $this->graphService->findShortestPath('C', 'A');

        $this->assertNotNull($resultForward);
        $this->assertNotNull($resultBackward);
        $this->assertEquals($resultForward['distance'], $resultBackward['distance']);
        $this->assertEquals(['A', 'B', 'C'], $resultForward['path']);
        $this->assertEquals(['C', 'B', 'A'], $resultBackward['path']);
    }
}
