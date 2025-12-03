<?php

namespace Database\Seeders;

use App\Models\Distance;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class DistanceSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('data/distances.json');
        $lines = json_decode(File::get($jsonPath), true);

        foreach ($lines as $line) {
            $lineName = $line['name'];

            foreach ($line['distances'] as $segment) {
                Distance::updateOrCreate(
                    [
                        'parent_station' => $segment['parent'],
                        'child_station' => $segment['child'],
                    ],
                    [
                        'line_name' => $lineName,
                        'distance_km' => $segment['distance'],
                    ]
                );
            }
        }
    }
}
