<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('distances', function (Blueprint $table) {
            $table->id();
            $table->string('line_name', 20);
            $table->string('parent_station', 10);
            $table->string('child_station', 10);
            $table->decimal('distance_km', 8, 2);
            $table->timestamps();

            $table->foreign('parent_station')
                ->references('short_name')
                ->on('stations')
                ->onDelete('cascade');

            $table->foreign('child_station')
                ->references('short_name')
                ->on('stations')
                ->onDelete('cascade');

            $table->unique(['parent_station', 'child_station']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('distances');
    }
};
