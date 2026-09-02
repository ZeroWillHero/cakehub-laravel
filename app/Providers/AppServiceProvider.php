<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\ServiceProvider;
use MatanYadaev\EloquentSpatial\EloquentSpatial;
use MatanYadaev\EloquentSpatial\Enums\Srid;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // No traditional login page exists (Google OAuth only) — send
        // unauthenticated users straight into the Google redirect flow.
        Authenticate::redirectUsing(fn () => route('auth.google.redirect'));

        // All geography(Point,4326) columns in this app (addresses.location,
        // sellers.location) use SRID 4326 (WGS84 lat/lng). Without this, a
        // bare `new Point($lat, $lng)` defaults to SRID 0, which breaks any
        // PostGIS distance comparison against the stored column with a
        // "mixed SRID geometries" error.
        EloquentSpatial::setDefaultSrid(Srid::WGS84);
    }
}
