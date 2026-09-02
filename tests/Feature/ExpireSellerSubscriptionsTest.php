<?php

use App\Enums\SellerSubscriptionStatus;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Support\Facades\Notification;

it('expires lapsed subscriptions and hides excess listings', function () {
    Notification::fake();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $plan = SubscriptionPlan::factory()->create(['price' => 19, 'listing_limit' => 10]);
    $subscription = SellerSubscription::factory()->for($seller)->for($plan, 'subscriptionPlan')->create([
        'status' => SellerSubscriptionStatus::Active,
        'ends_at' => now()->subDay(),
    ]);
    Product::factory()->count(3)->for($seller)->create(['is_active' => true]);
    SubscriptionPlan::factory()->create(['price' => 0, 'listing_limit' => 1, 'is_active' => true]);

    $this->artisan('app:expire-seller-subscriptions')->assertSuccessful();

    expect($subscription->fresh()->status)->toBe(SellerSubscriptionStatus::Expired);
    expect($seller->products()->where('is_active', true)->count())->toBe(1);
    Notification::assertSentTo($seller->user, SubscriptionStatusUpdated::class);
});

it('leaves subscriptions with no ends_at or a future ends_at untouched', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $plan = SubscriptionPlan::factory()->create();
    $noExpiry = SellerSubscription::factory()->for($seller)->for($plan, 'subscriptionPlan')->create([
        'status' => SellerSubscriptionStatus::Active,
        'ends_at' => null,
    ]);
    $futureExpiry = SellerSubscription::factory()->for($plan, 'subscriptionPlan')->create([
        'status' => SellerSubscriptionStatus::Active,
        'ends_at' => now()->addMonth(),
    ]);

    $this->artisan('app:expire-seller-subscriptions')->assertSuccessful();

    expect($noExpiry->fresh()->status)->toBe(SellerSubscriptionStatus::Active);
    expect($futureExpiry->fresh()->status)->toBe(SellerSubscriptionStatus::Active);
});
