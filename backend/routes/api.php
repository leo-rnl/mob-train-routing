<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

Route::prefix('v1')->group(function () {
    // Auth routes will be added in Phase 3
    // Route::post('/auth/token', ...);

    // Station routes will be added in Phase 3
    // Route::get('/stations', ...);

    // Route calculation will be added in Phase 3
    // Route::post('/routes', ...);

    // Stats will be added in Phase 3
    // Route::get('/stats/distances', ...);
});
