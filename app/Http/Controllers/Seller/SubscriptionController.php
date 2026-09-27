<?php

namespace App\Http\Controllers\Seller;

use App\Enums\SellerSubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\SubscribeRequest;
use App\Http\Resources\SellerSubscriptionResource;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function checkout(SubscribeRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;
        $plan = SubscriptionPlan::query()->findOrFail($request->validated('subscription_plan_id'));

        // Manual bank-transfer payment (Phase 8): the subscription starts
        // pending — it only becomes active (and the previous active
        // subscription is cancelled, listing limits re-applied) once its
        // linked Payment is verified by an admin, in
        // Admin\PaymentVerificationController@verify. No gateway call here;
        // external_subscription_id stays null.
        $subscription = $seller->subscriptions()->create([
            'subscription_plan_id' => $plan->id,
            'status' => SellerSubscriptionStatus::Pending,
        ]);

        return (new SellerSubscriptionResource($subscription->load('subscriptionPlan')))
            ->response()
            ->setStatusCode(201);
    }
}
