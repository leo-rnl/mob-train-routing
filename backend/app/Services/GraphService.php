<?php

namespace App\Services;

use App\Models\Distance;
use SplPriorityQueue;

class GraphService
{
    /**
     * @var array<string, array<string, float>>
     */
    private array $graph = [];

    private bool $loaded = false;

    /**
     * Load the graph from the database.
     */
    public function loadGraph(): void
    {
        if ($this->loaded) {
            return;
        }

        $distances = Distance::all();

        foreach ($distances as $distance) {
            $parent = $distance->parent_station;
            $child = $distance->child_station;
            $dist = (float) $distance->distance_km;

            // Bidirectional graph
            $this->addEdge($parent, $child, $dist);
            $this->addEdge($child, $parent, $dist);
        }

        $this->loaded = true;
    }

    /**
     * Add an edge to the graph.
     */
    private function addEdge(string $from, string $to, float $distance): void
    {
        if (!isset($this->graph[$from])) {
            $this->graph[$from] = [];
        }
        $this->graph[$from][$to] = $distance;
    }

    /**
     * Set graph manually (for testing).
     *
     * @param array<string, array<string, float>> $graph
     */
    public function setGraph(array $graph): void
    {
        $this->graph = $graph;
        $this->loaded = true;
    }

    /**
     * Get all station codes in the graph.
     *
     * @return array<string>
     */
    public function getStations(): array
    {
        return array_keys($this->graph);
    }

    /**
     * Check if a station exists in the graph.
     */
    public function hasStation(string $stationCode): bool
    {
        return isset($this->graph[$stationCode]);
    }

    /**
     * Find the shortest path between two stations using Dijkstra's algorithm.
     *
     * @return array{distance: float, path: array<string>}|null
     */
    public function findShortestPath(string $from, string $to): ?array
    {
        if (!$this->loaded) {
            $this->loadGraph();
        }

        if (!isset($this->graph[$from]) || !isset($this->graph[$to])) {
            return null;
        }

        if ($from === $to) {
            return [
                'distance' => 0.0,
                'path' => [$from],
            ];
        }

        /** @var array<string, float> $distances */
        $distances = [];

        /** @var array<string, string|null> $previous */
        $previous = [];

        /** @var array<string, bool> $visited */
        $visited = [];

        // Initialize distances
        foreach (array_keys($this->graph) as $station) {
            $distances[$station] = PHP_FLOAT_MAX;
            $previous[$station] = null;
        }
        $distances[$from] = 0.0;

        // Priority queue: [distance, station]
        $queue = new SplPriorityQueue();
        $queue->setExtractFlags(SplPriorityQueue::EXTR_BOTH);
        $queue->insert($from, 0);

        while (!$queue->isEmpty()) {
            $current = $queue->extract();
            /** @var string $currentStation */
            $currentStation = $current['data'];

            if (isset($visited[$currentStation])) {
                continue;
            }
            $visited[$currentStation] = true;

            if ($currentStation === $to) {
                break;
            }

            if (!isset($this->graph[$currentStation])) {
                continue;
            }

            foreach ($this->graph[$currentStation] as $neighbor => $weight) {
                if (isset($visited[$neighbor])) {
                    continue;
                }

                $newDistance = $distances[$currentStation] + $weight;

                if ($newDistance < $distances[$neighbor]) {
                    $distances[$neighbor] = $newDistance;
                    $previous[$neighbor] = $currentStation;
                    // Use negative priority for min-heap behavior
                    $queue->insert($neighbor, -$newDistance);
                }
            }
        }

        // No path found
        if ($distances[$to] === PHP_FLOAT_MAX) {
            return null;
        }

        // Reconstruct path
        $path = [];
        $current = $to;
        while ($current !== null) {
            array_unshift($path, $current);
            $current = $previous[$current];
        }

        return [
            'distance' => round($distances[$to], 2),
            'path' => $path,
        ];
    }
}
