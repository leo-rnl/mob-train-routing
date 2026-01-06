<?php

namespace App\Contracts;

interface GraphServiceInterface
{
    /**
     * Load the graph from the repository.
     */
    public function loadGraph(): void;

    /**
     * Get all station codes in the graph.
     *
     * @return array<string>
     */
    public function getStations(): array;

    /**
     * Check if a station exists in the graph.
     */
    public function hasStation(string $stationCode): bool;

    /**
     * Find the shortest path between two stations using Dijkstra's algorithm.
     *
     * @return array{distance: float, path: array<string>}|null
     */
    public function findShortestPath(string $from, string $to): ?array;
}
