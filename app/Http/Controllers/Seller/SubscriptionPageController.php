<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\SellerSubscriptionResource;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionPageController extends Controller
{
    public function show(Request $request): Response
    {
        $seller = $request->user()->seller;

        $plans = SubscriptionPlan::query()->where('is_active', true)->orderBy('sort_order')->get();
        $history = $seller->subscriptions()->with('subscriptionPlan')->latest('starts_at')->get();

        return Inertia::render('Seller/Subscription', [
            'plans' => SubscriptionPlanResource::collection($plans)->resolve(),
            'currentSubscription' => $seller->activeSubscription()
                ? (new SellerSubscriptionResource($seller->activeSubscription()))->resolve()
                : null,
            'history' => SellerSubscriptionResource::collection($history)->resolve(),
            'usage' => $seller->listingUsage(),
            'limit' => $seller->listingLimit(),
        ]);
    }
}
