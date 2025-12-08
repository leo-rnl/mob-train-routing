<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RouteController;
use App\Http\Controllers\Api\V1\StationController;
use App\Http\Controllers\Api\V1\StatsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/stations', [StationController::class, 'index']);
        Route::get('/routes', [RouteController::class, 'index']);
        Route::post('/routes', [RouteController::class, 'store']);
        Route::get('/stats/distances', [StatsController::class, 'distances']);
    });
});
