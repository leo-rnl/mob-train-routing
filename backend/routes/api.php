<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RouteController;
use App\Http\Controllers\Api\V1\StationController;
use App\Http\Controllers\Api\V1\StatsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/token', [AuthController::class, 'createToken']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/stations', [StationController::class, 'index']);
        Route::get('/routes', [RouteController::class, 'index']);
        Route::post('/routes', [RouteController::class, 'store']);
        Route::get('/stats/distances', [StatsController::class, 'distances']);
    });
});
