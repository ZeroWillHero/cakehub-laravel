<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust the Caddy reverse proxy in front of the app container so
        // X-Forwarded-Proto/Host are honored — without this, Laravel sees
        // every request as plain HTTP (Caddy terminates TLS and forwards
        // HTTP internally), which corrupts redirect()->route(...) URLs
        // (e.g. the post-OAuth /onboarding redirect) and breaks Secure
        // session cookies. Trusting '*' is safe here: the app container is
        // never published to the host (docker-compose.yml only `expose`s
        // it), so Caddy is the only possible proxy hop.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->statefulApi();
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'account.active' => \App\Http\Middleware\EnsureAccountIsActive::class,
            'guest.or.role' => \App\Http\Middleware\EnsureGuestOrRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
