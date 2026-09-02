<?php

use App\Enums\SellerSubscriptionStatus;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;

it('falls back to the default free plan listing limit when the seller has no subscription', function () {
    SubscriptionPlan::factory()->create(['name' => 'Free', 'price' => 0, 'listing_limit' => 5, 'is_active' => true]);
    $seller = Seller::factory()->create();

    expect($seller->listingLimit())->toBe(5);
});

it('uses the active subscription plan listing limit when one exists', function () {
    SubscriptionPlan::factory()->create(['name' => 'Free', 'price' => 0, 'listing_limit' => 5]);
    $proPlan = SubscriptionPlan::factory()->create(['name' => 'Pro', 'price' => 19, 'listing_limit' => 50]);
    $seller = Seller::factory()->create();
    SellerSubscription::factory()->for($seller)->for($proPlan, 'subscriptionPlan')->create([
        'status' => SellerSubscriptionStatus::Active,
        'starts_at' => now(),
    ]);

    expect($seller->listingLimit())->toBe(50);
});

it('treats a null listing_limit as unlimited', function () {
    $seller = Seller::factory()->create();
    $premiumPlan = SubscriptionPlan::factory()->create(['name' => 'Premium', 'listing_limit' => null]);
    SellerSubscription::factory()->for($seller)->for($premiumPlan, 'subscriptionPlan')->create([
        'status' => SellerSubscriptionStatus::Active,
        'starts_at' => now(),
    ]);

    expect($seller->listingLimit())->toBeNull();
});

it('counts inactive listings toward usage, not just active ones', function () {
    $seller = Seller::factory()->create();
    Product::factory()->for($seller)->create(['is_active' => true]);
    Product::factory()->for($seller)->create(['is_active' => false]);

    expect($seller->listingUsage())->toBe(2);
});
