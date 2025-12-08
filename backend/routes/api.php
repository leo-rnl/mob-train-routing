<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RouteController;
use App\Http\Controllers\Api\V1\StationController;
use App\Http\Controllers\Api\V1\StatsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public routes with login-specific rate limiting (5 req/min)
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login');

    // Protected routes with API rate limiting (60 req/min)
    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/stations', [StationController::class, 'index']);
        Route::get('/routes', [RouteController::class, 'index']);
        Route::post('/routes', [RouteController::class, 'store']);
        Route::get('/stats/distances', [StatsController::class, 'distances']);
    });
});
