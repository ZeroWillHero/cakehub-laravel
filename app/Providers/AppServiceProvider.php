<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\ServiceProvider;

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
    }
}
