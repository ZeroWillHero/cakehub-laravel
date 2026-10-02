<?php

namespace App\Http\Controllers\Customer;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\SellerResource;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\Ad;
use App\Models\AdSetting;
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

        // Guests see the same Home as customers — browsing is public, and
        // sign-in is only asked for at checkout
        // (docs/plan-public-browsing-guest-cart.md D1).
        if ($user === null) {
            return Inertia::render('Customer/Home', $this->homeProps(forGuest: true));
        }

        if ($user->role === null) {
            return redirect()->route('onboarding.show');
        }

        return match ($user->role) {
            UserRole::Customer => Inertia::render('Customer/Home', $this->homeProps(forGuest: false)),
            UserRole::Seller => redirect()->route('seller.dashboard'),
            UserRole::Admin => redirect()->route('admin.dashboard'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function homeProps(bool $forGuest): array
    {
        return [
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
            // can see pricing before starting onboarding. Guests only — a
            // signed-in customer has already chosen to be a buyer, so they
            // get no seller plans or "Become a seller" prompts at all.
            'subscriptionPlans' => $forGuest
                ? SubscriptionPlanResource::collection(
                    SubscriptionPlan::query()->where('is_active', true)->orderBy('sort_order')->get()
                )->resolve()
                : [],
            'ads' => AdResource::collection(
                Ad::query()->eligible()->orderBy('sort_order')->get()
            )->resolve(),
            'adRotationSeconds' => AdSetting::current()->rotation_seconds,
        ];
    }
}
