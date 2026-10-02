<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Like EnsureUserHasRole, but lets signed-out guests through instead of
 * 401-ing them — for pages a guest can use before signing in (the session
 * cart, see docs/plan-public-browsing-guest-cart.md).
 */
class EnsureGuestOrRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        if ($user->role === null) {
            return redirect()->route('onboarding.show');
        }

        $allowed = array_map(fn (string $role) => UserRole::from($role), $roles);

        if (! in_array($user->role, $allowed, strict: true)) {
            abort(403);
        }

        return $next($request);
    }
}
