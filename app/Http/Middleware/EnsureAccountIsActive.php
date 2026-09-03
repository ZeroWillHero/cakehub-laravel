<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status !== null && $user->status !== UserStatus::Active) {
            Auth::guard('web')->logout();

            abort(403, 'This account has been deactivated.');
        }

        return $next($request);
    }
}
