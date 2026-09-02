<?php

namespace App\Http\Controllers\Customer;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        $user = request()->user();

        if ($user === null) {
            return Inertia::render('Welcome');
        }

        if ($user->role === null) {
            return redirect()->route('onboarding.show');
        }

        return match ($user->role) {
            UserRole::Customer => Inertia::render('Customer/Home'),
            UserRole::Seller => redirect()->route('seller.dashboard'),
            UserRole::Admin => redirect()->route('admin.dashboard'),
        };
    }
}
