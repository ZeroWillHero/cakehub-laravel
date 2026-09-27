<?php

use App\Enums\SellerSubscriptionStatus;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Support\Facades\Notification;

it('lets a seller subscribe to a plan, starting pending until payment is verified', function () {
    Notification::fake();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $plan = SubscriptionPlan::factory()->create(['name' => 'Pro', 'listing_limit' => 50, 'billing_cycle' => 'monthly']);

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $plan->id])
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.plan.name', 'Pro');

    expect($seller->activeSubscription())->toBeNull();
    // No gateway charge, no notification yet — that happens once an admin
    // verifies the bank-transfer slip (Phase 8).
    Notification::assertNotSentTo($seller->user, SubscriptionStatusUpdated::class);
});

it('keeps the previous active subscription untouched while the new one is pending', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $oldPlan = SubscriptionPlan::factory()->create(['name' => 'Basic']);
    $old = SellerSubscription::factory()->for($seller)->for($oldPlan, 'subscriptionPlan')->create();
    $newPlan = SubscriptionPlan::factory()->create(['name' => 'Pro']);

    $this->actingAs($seller->user)
        ->postJson('/api/seller/subscription/checkout', ['subscription_plan_id' => $newPlan->id])
        ->assertCreated();

    // The old subscription is only cancelled once the new one's payment is
    // verified (Admin\PaymentVerificationController@verify) — see
    // tests/Feature/PaymentApiTest.php.
    expect($old->fresh()->status)->toBe(SellerSubscriptionStatus::Active);
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
