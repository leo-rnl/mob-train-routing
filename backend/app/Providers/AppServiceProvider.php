<?php

namespace App\Providers;

use App\Contracts\AuthServiceInterface;
use App\Contracts\DistanceRepositoryInterface;
use App\Contracts\GraphServiceInterface;
use App\Contracts\RouteRepositoryInterface;
use App\Contracts\RouteServiceInterface;
use App\Contracts\StationRepositoryInterface;
use App\Contracts\StatsServiceInterface;
use App\Repositories\DistanceRepository;
use App\Repositories\RouteRepository;
use App\Repositories\StationRepository;
use App\Services\AuthService;
use App\Services\GraphService;
use App\Services\RouteService;
use App\Services\StatsService;
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
        $this->app->bind(StationRepositoryInterface::class, StationRepository::class);

        // Services
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(RouteServiceInterface::class, RouteService::class);
        $this->app->bind(StatsServiceInterface::class, StatsService::class);
        $this->app->singleton(GraphServiceInterface::class, GraphService::class);
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
