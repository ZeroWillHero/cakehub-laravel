<?php

use App\Enums\SellerSubscriptionStatus;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;

it('lets an admin create a subscription plan', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/subscription-plans', [
            'name' => 'Enterprise',
            'price' => 99,
            'billing_cycle' => 'monthly',
            'listing_limit' => null,
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Enterprise')
        ->assertJsonPath('data.listing_limit', null)
        ->assertJsonPath('data.is_active', true);
});

it('lets an admin update a subscription plan', function () {
    $admin = User::factory()->admin()->create();
    $plan = SubscriptionPlan::factory()->create(['price' => 9]);

    $this->actingAs($admin)
        ->putJson("/api/admin/subscription-plans/{$plan->id}", ['price' => 15])
        ->assertOk()
        ->assertJsonPath('data.price', 15);
});

it('hides excess listings for active subscribers when the plan limit is lowered', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->create();
    $plan = SubscriptionPlan::factory()->create(['listing_limit' => 10]);
    SellerSubscription::factory()->for($seller)->for($plan, 'subscriptionPlan')->create();
    Product::factory()->count(3)->for($seller)->create(['is_active' => true]);

    $this->actingAs($admin)
        ->putJson("/api/admin/subscription-plans/{$plan->id}", ['listing_limit' => 1])
        ->assertOk();

    expect($seller->products()->where('is_active', true)->count())->toBe(1);
});

it('lets an admin delete a plan with no subscribers', function () {
    $admin = User::factory()->admin()->create();
    $plan = SubscriptionPlan::factory()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/subscription-plans/{$plan->id}")
        ->assertOk();

    expect(SubscriptionPlan::query()->find($plan->id))->toBeNull();
});

it('rejects deleting a plan with active subscribers and no migration target', function () {
    $admin = User::factory()->admin()->create();
    $plan = SubscriptionPlan::factory()->create();
    SellerSubscription::factory()->for($plan, 'subscriptionPlan')->create(['status' => SellerSubscriptionStatus::Active]);

    $this->actingAs($admin)
        ->deleteJson("/api/admin/subscription-plans/{$plan->id}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['migrate_to']);
});

it('lets an admin delete a plan with subscribers by migrating them', function () {
    $admin = User::factory()->admin()->create();
    $plan = SubscriptionPlan::factory()->create();
    $targetPlan = SubscriptionPlan::factory()->create();
    $subscription = SellerSubscription::factory()->for($plan, 'subscriptionPlan')->create(['status' => SellerSubscriptionStatus::Active]);

    $this->actingAs($admin)
        ->deleteJson("/api/admin/subscription-plans/{$plan->id}", ['migrate_to' => $targetPlan->id])
        ->assertOk();

    expect(SubscriptionPlan::query()->find($plan->id))->toBeNull();
    expect($subscription->fresh()->subscription_plan_id)->toBe($targetPlan->id);
});

it('lets an admin toggle a plan active/inactive', function () {
    $admin = User::factory()->admin()->create();
    $plan = SubscriptionPlan::factory()->create(['is_active' => true]);

    $this->actingAs($admin)
        ->patchJson("/api/admin/subscription-plans/{$plan->id}/toggle")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);
});

it('lets an admin reorder plans', function () {
    $admin = User::factory()->admin()->create();
    $a = SubscriptionPlan::factory()->create(['sort_order' => 0]);
    $b = SubscriptionPlan::factory()->create(['sort_order' => 1]);

    $this->actingAs($admin)
        ->patchJson('/api/admin/subscription-plans/reorder', ['order' => [$b->id, $a->id]])
        ->assertOk();

    expect($a->fresh()->sort_order)->toBe(1);
    expect($b->fresh()->sort_order)->toBe(0);
});

it('forbids a non-admin from creating a subscription plan', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->postJson('/api/admin/subscription-plans', ['name' => 'X', 'price' => 1])
        ->assertForbidden();
});

it('rejects an unauthenticated subscription plan creation', function () {
    $this->postJson('/api/admin/subscription-plans', ['name' => 'X', 'price' => 1])->assertUnauthorized();
});

it('renders the admin subscription plans page', function () {
    $admin = User::factory()->admin()->create();
    SubscriptionPlan::factory()->count(2)->create();

    $this->actingAs($admin)->get('/admin/subscription-plans')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/SubscriptionPlans'));
});
