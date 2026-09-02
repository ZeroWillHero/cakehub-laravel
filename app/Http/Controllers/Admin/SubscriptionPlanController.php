<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SellerSubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DestroySubscriptionPlanRequest;
use App\Http\Requests\Admin\ReorderSubscriptionPlansRequest;
use App\Http\Requests\Admin\StoreSubscriptionPlanRequest;
use App\Http\Requests\Admin\UpdateSubscriptionPlanRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionPlanController extends Controller
{
    public function index(Request $request): Response
    {
        $plans = SubscriptionPlan::query()->orderBy('sort_order')->get();

        return Inertia::render('Admin/SubscriptionPlans', [
            'plans' => SubscriptionPlanResource::collection($plans)->resolve(),
        ]);
    }

    public function store(StoreSubscriptionPlanRequest $request): JsonResponse
    {
        $plan = SubscriptionPlan::query()->create([
            'is_active' => true,
            'features' => [],
            ...$request->validated(),
            'sort_order' => SubscriptionPlan::query()->max('sort_order') + 1,
        ]);

        return (new SubscriptionPlanResource($plan))->response()->setStatusCode(201);
    }

    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $plan): JsonResponse
    {
        $previousLimit = $plan->listing_limit;
        $plan->update($request->validated());

        if ($plan->listing_limit !== null && ($previousLimit === null || $plan->listing_limit < $previousLimit)) {
            Seller::query()
                ->whereHas('subscriptions', fn ($q) => $q->where('subscription_plan_id', $plan->id)->where('status', SellerSubscriptionStatus::Active))
                ->get()
                ->each(fn (Seller $seller) => $seller->hideExcessListings());
        }

        return (new SubscriptionPlanResource($plan))->response();
    }

    public function destroy(DestroySubscriptionPlanRequest $request, SubscriptionPlan $plan): JsonResponse
    {
        DB::transaction(function () use ($request, $plan) {
            $migrateTo = $request->validated('migrate_to');
            if ($migrateTo) {
                SellerSubscription::query()
                    ->where('subscription_plan_id', $plan->id)
                    ->where('status', SellerSubscriptionStatus::Active)
                    ->update(['subscription_plan_id' => $migrateTo]);
            }

            $plan->delete();
        });

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function toggleActive(SubscriptionPlan $plan): JsonResponse
    {
        $plan->update(['is_active' => ! $plan->is_active]);

        return (new SubscriptionPlanResource($plan))->response();
    }

    public function reorder(ReorderSubscriptionPlansRequest $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            foreach ($request->validated('order') as $index => $planId) {
                SubscriptionPlan::query()->whereKey($planId)->update(['sort_order' => $index]);
            }
        });

        return response()->json(['data' => ['reordered' => true]]);
    }
}
