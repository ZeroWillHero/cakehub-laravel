<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CartMerger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $user = User::query()->updateOrCreate(
            ['google_id' => $googleUser->getId()],
            [
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'avatar_url' => $googleUser->getAvatar(),
            ],
        );

        if ($user->role === null && $this->isAdminEmail($user->email)) {
            $user->update(['role' => UserRole::Admin]);
        }

        Auth::login($user, remember: true);

        // A brand-new user picks their role first; any guest cart and the
        // checkout URL they were heading to wait in the session until then
        // (OnboardingController hands them to CartMerger).
        if ($user->role === null) {
            return redirect()->route('onboarding.show');
        }

        $cartMerger = new CartMerger(request()->session());

        if ($user->role === UserRole::Customer) {
            return $cartMerger->afterCustomerSignIn($user);
        }

        // Sellers/admins ignore the intended URL — a stale customer URL
        // (e.g. /checkout) would only 403 for them.
        $cartMerger->discardForNonCustomer();

        return match ($user->role) {
            UserRole::Seller => redirect()->route('seller.dashboard'),
            UserRole::Admin => redirect()->route('admin.dashboard'),
        };
    }

    /**
     * Admins are provisioned via an email allowlist (config('app.admin_emails'),
     * from the ADMIN_EMAILS env var) rather than a database seeder, since
     * auth is Google-only and there's no google_id to pre-seed a row with.
     * Checked whenever a user's role is still unset, not just on their very
     * first row-creation, so it also covers a user who signed in once before
     * being added to the allowlist.
     */
    private function isAdminEmail(string $email): bool
    {
        return in_array(strtolower($email), config('app.admin_emails', []), strict: true);
    }
}
