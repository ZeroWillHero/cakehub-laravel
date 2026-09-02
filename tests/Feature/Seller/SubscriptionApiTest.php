<?php

use App\Enums\SellerSubscriptionStatus;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Support\Facades\Notification;

it('lets a seller subscribe to a plan', function () {
    Notification::fake();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $plan = SubscriptionPlan::factory()->create(['name' => 'Pro', 'listing_limit' => 50, 'billing_cycle' => 'monthly']);

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $plan->id])
        ->assertCreated()
        ->assertJsonPath('data.status', 'active')
        ->assertJsonPath('data.plan.name', 'Pro');

    expect($seller->activeSubscription()->subscription_plan_id)->toBe($plan->id);
    Notification::assertSentTo($seller->user, SubscriptionStatusUpdated::class);
});

it('cancels the previous active subscription when subscribing to a new plan', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $oldPlan = SubscriptionPlan::factory()->create(['name' => 'Basic']);
    $old = SellerSubscription::factory()->for($seller)->for($oldPlan, 'subscriptionPlan')->create();
    $newPlan = SubscriptionPlan::factory()->create(['name' => 'Pro']);

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $newPlan->id])
        ->assertCreated();

    expect($old->fresh()->status)->toBe(SellerSubscriptionStatus::Cancelled);
});

it('hides excess listings when downgrading to a lower limit', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $bigPlan = SubscriptionPlan::factory()->create(['listing_limit' => 10]);
    SellerSubscription::factory()->for($seller)->for($bigPlan, 'subscriptionPlan')->create();
    Product::factory()->count(3)->for($seller)->create(['is_active' => true]);
    $smallPlan = SubscriptionPlan::factory()->create(['listing_limit' => 1]);

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $smallPlan->id])
        ->assertCreated();

    expect($seller->products()->where('is_active', true)->count())->toBe(1);
    expect($seller->products()->count())->toBe(3);
});

it('rejects subscribing to an inactive plan', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $plan = SubscriptionPlan::factory()->create(['is_active' => false]);

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $plan->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['subscription_plan_id']);
});

it('rejects subscribing to a nonexistent plan', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => 999999])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['subscription_plan_id']);
});

it('rejects a non-seller from subscribing', function () {
    $customer = User::factory()->customer()->create();
    $plan = SubscriptionPlan::factory()->create();

    $this->actingAs($customer)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $plan->id])
        ->assertForbidden();
});

it('rejects an unauthenticated subscription checkout', function () {
    $plan = SubscriptionPlan::factory()->create();

    $this->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $plan->id])
        ->assertUnauthorized();
});

it('renders the seller subscription page', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    SubscriptionPlan::factory()->create(['is_active' => true]);

    $this->actingAs($seller->user)->get('/seller/subscription')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Seller/Subscription'));
});
