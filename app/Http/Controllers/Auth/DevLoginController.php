<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * TEMPORARY, local-only test-login bypass for the Phase 9 Chrome UI audit.
 *
 * Auth is Google OAuth only (see CLAUDE.md §2) — there is no real
 * password/dev-login flow, and this must never work outside `local` (see
 * the environment() guard below, checked first on every call, plus the
 * route registration guard in routes/web.php). It logs in as one of the
 * canonical users seeded by database/seeders/AuditTestDataSeeder.php so the
 * browser-tool audit can reach every role's screens without a real Google
 * account. Left in the diff per the user's explicit instruction — not
 * wired into any production path, not documented as a supported feature.
 */
class DevLoginController extends Controller
{
    /**
     * @var array<string, string> slug => seeded audit user email
     */
    private const array USERS = [
        'admin' => 'audit.admin@cakehub.test',
        'customer' => 'audit.customer.history@cakehub.test',
        'customer-cart' => 'audit.customer.cart@cakehub.test',
        'customer-fresh' => 'audit.customer.fresh@cakehub.test',
        'seller' => 'audit.seller.active@cakehub.test',
        'seller-pending' => 'audit.seller.pending@cakehub.test',
        'seller-free' => 'audit.seller.free@cakehub.test',
        'seller-expired' => 'audit.seller.expired@cakehub.test',
        'seller-rejected' => 'audit.seller.rejected@cakehub.test',
    ];

    public function login(string $slug): RedirectResponse
    {
        abort_unless(App::environment('local'), Response::HTTP_NOT_FOUND);

        $email = self::USERS[$slug] ?? null;
        abort_if($email === null, Response::HTTP_NOT_FOUND, "Unknown dev-login slug '{$slug}'.");

        $user = User::query()->where('email', $email)->first();
        abort_if($user === null, Response::HTTP_NOT_FOUND, "Seed user for '{$slug}' not found — run: php artisan db:seed --class=AuditTestDataSeeder");

        Auth::login($user);

        return match ($user->role) {
            UserRole::Admin => redirect()->route('admin.dashboard'),
            UserRole::Seller => redirect()->route('seller.dashboard'),
            UserRole::Customer, null => redirect()->route('home'),
        };
    }
}
