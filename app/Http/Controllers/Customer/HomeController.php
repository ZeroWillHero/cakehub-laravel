<?php

namespace App\Http\Controllers\Customer;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\SellerResource;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\Category;
use App\Models\Seller;
use App\Models\SubscriptionPlan;
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
            UserRole::Customer => Inertia::render('Customer/Home', [
                'categories' => CategoryResource::collection(
                    Category::query()->where('is_active', true)->orderBy('sort_order')->get()
                )->resolve(),
                // "Featured" sellers are simply the top-rated, live, verified
                // sellers — no dedicated is_featured column (see plan notes).
                'featuredSellers' => SellerResource::collection(
                    Seller::query()
                        ->where('store_status', StoreStatus::Open)
                        ->where('verification_status', VerificationStatus::Verified)
                        ->orderByDesc('average_rating')
                        ->limit(8)
                        ->get()
                )->resolve(),
                // Shown in the "Sell on CakeHub" section so prospective sellers
                // can see pricing before starting onboarding.
                'subscriptionPlans' => SubscriptionPlanResource::collection(
                    SubscriptionPlan::query()->where('is_active', true)->orderBy('sort_order')->get()
                )->resolve(),
            ]),
            UserRole::Seller => redirect()->route('seller.dashboard'),
            UserRole::Admin => redirect()->route('admin.dashboard'),
        };
    }
}
