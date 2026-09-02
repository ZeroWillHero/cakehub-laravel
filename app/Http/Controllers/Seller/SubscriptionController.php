<?php

namespace App\Http\Controllers\Seller;

use App\Enums\SellerSubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\SubscribeRequest;
use App\Http\Resources\SellerSubscriptionResource;
use App\Models\SubscriptionPlan;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    public function checkout(SubscribeRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;
        $plan = SubscriptionPlan::query()->findOrFail($request->validated('subscription_plan_id'));
        $previousLimit = $seller->listingLimit();

        $subscription = DB::transaction(function () use ($seller, $plan) {
            $seller->subscriptions()
                ->where('status', SellerSubscriptionStatus::Active)
                ->update(['status' => SellerSubscriptionStatus::Cancelled, 'ends_at' => now()]);

            $endsAt = match ($plan->billing_cycle) {
                'monthly' => now()->addMonth(),
                'annual' => now()->addYear(),
                default => null,
            };

            return $seller->subscriptions()->create([
                'subscription_plan_id' => $plan->id,
                // Payment is stubbed (Phase 0 decision, same pattern as Phase 4's
                // checkout) — no real gateway call, external_subscription_id stays null.
                'status' => SellerSubscriptionStatus::Active,
                'starts_at' => now(),
                'ends_at' => $endsAt,
            ]);
        });

        if ($plan->listing_limit !== null && ($previousLimit === null || $plan->listing_limit < $previousLimit)) {
            $seller->hideExcessListings();
        }

        $seller->user->notify(new SubscriptionStatusUpdated(
            'Your subscription is now '.$plan->name,
            "You're now subscribed to the {$plan->name} plan.",
        ));

        return (new SellerSubscriptionResource($subscription->load('subscriptionPlan')))
            ->response()
            ->setStatusCode(201);
    }
}
