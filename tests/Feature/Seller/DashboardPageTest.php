<?php

use App\Enums\OrderStatus;
use App\Enums\SellerSubscriptionStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\SellerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;

it('does not expose analytics to a seller on a plan without the feature', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Order::factory()->for($seller)->create();

    $this->actingAs($seller->user)->get('/seller/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Seller/Dashboard')
            ->where('hasAnalyticsAccess', false)
            ->where('analytics', null)
            ->has('recentOrders', 1));
});

it('exposes analytics to a seller on a plan with basic_analytics', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $plan = SubscriptionPlan::factory()->create(['features' => ['basic_analytics' => true]]);
    SellerSubscription::factory()->for($seller)->for($plan, 'subscriptionPlan')->create(['status' => SellerSubscriptionStatus::Active]);
    Order::factory()->for($seller)->create(['status' => OrderStatus::Completed, 'total' => 42]);

    $this->actingAs($seller->user)->get('/seller/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Seller/Dashboard')
            ->where('hasAnalyticsAccess', true)
            ->has('analytics.ordersOverTime', 30)
            ->where('analytics.orderValueTotal', 42));
});

it('only counts the seller\'s own orders in their analytics', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->create();
    $plan = SubscriptionPlan::factory()->create(['features' => ['basic_analytics' => true]]);
    SellerSubscription::factory()->for($sellerA)->for($plan, 'subscriptionPlan')->create(['status' => SellerSubscriptionStatus::Active]);
    Order::factory()->for($sellerA)->create();
    Order::factory()->for($sellerB)->create();
    Order::factory()->for($sellerB)->create();

    $response = $this->actingAs($sellerA->user)->get('/seller/dashboard')->assertOk();
    $total = collect($response->viewData('page')['props']['analytics']['ordersOverTime'])->sum('count');

    expect($total)->toBe(1);
});
