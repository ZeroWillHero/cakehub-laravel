<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
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

        Auth::login($user, remember: true);

        if ($user->role === null) {
            return redirect()->route('onboarding.show');
        }

        return match ($user->role) {
            UserRole::Customer => redirect()->route('home'),
            UserRole::Seller => redirect()->route('seller.dashboard'),
            UserRole::Admin => redirect()->route('admin.dashboard'),
        };
    }
}
