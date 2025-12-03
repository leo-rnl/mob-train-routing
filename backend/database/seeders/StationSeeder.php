<?php

namespace Database\Seeders;

use App\Models\Station;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class StationSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('data/stations.json');
        $stations = json_decode(File::get($jsonPath), true);

        foreach ($stations as $station) {
            Station::updateOrCreate(
                ['short_name' => $station['shortName']],
                ['long_name' => $station['longName']]
            );
        }
    }
}
