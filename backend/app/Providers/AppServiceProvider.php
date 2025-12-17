<?php

namespace App\Providers;

use App\Contracts\AuthServiceInterface;
use App\Contracts\DistanceRepositoryInterface;
use App\Contracts\RouteRepositoryInterface;
use App\Contracts\RouteServiceInterface;
use App\Repositories\DistanceRepository;
use App\Repositories\RouteRepository;
use App\Services\AuthService;
use App\Services\GraphService;
use App\Services\RouteService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Repositories
        $this->app->bind(DistanceRepositoryInterface::class, DistanceRepository::class);
        $this->app->bind(RouteRepositoryInterface::class, RouteRepository::class);

        // Services
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(RouteServiceInterface::class, RouteService::class);

        // GraphService as singleton (graph is static data)
        $this->app->singleton(GraphService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        $this->configureRateLimiting();
    }

    /**
     * Configure API rate limiters.
     */
    private function configureRateLimiting(): void
    {
        // Login endpoint: 5 requests per minute (brute force protection)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // API endpoints: 60 requests per minute per user
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
