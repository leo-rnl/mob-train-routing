<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('from_station_id', 10);
            $table->string('to_station_id', 10);
            $table->string('analytic_code', 50);
            $table->decimal('distance_km', 10, 2);
            $table->json('path');
            $table->timestamps();

            $table->foreign('from_station_id')
                ->references('short_name')
                ->on('stations')
                ->onDelete('cascade');

            $table->foreign('to_station_id')
                ->references('short_name')
                ->on('stations')
                ->onDelete('cascade');

            $table->index('analytic_code');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
