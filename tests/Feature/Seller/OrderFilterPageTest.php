<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('filters the seller orders page by status', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Order::factory()->for($seller)->create(['status' => OrderStatus::Placed]);
    Order::factory()->for($seller)->create(['status' => OrderStatus::Completed]);

    $this->actingAs($seller->user)
        ->get('/seller/orders?status=completed')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Seller/Orders')
            ->has('orders', 1)
            ->where('orders.0.status', 'completed')
        );
});

it('filters the seller orders page by scheduled date range', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Order::factory()->for($seller)->create(['scheduled_at' => now()->addDays(1)]);
    Order::factory()->for($seller)->create(['scheduled_at' => now()->addDays(10)]);

    $from = now()->addDays(5)->toDateString();
    $to = now()->addDays(15)->toDateString();

    $this->actingAs($seller->user)
        ->get("/seller/orders?from={$from}&to={$to}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Seller/Orders')
            ->has('orders', 1)
        );
});

it('rejects an invalid status filter value', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();

    $this->actingAs($seller->user)
        ->get('/seller/orders?status=bogus')
        ->assertStatus(302);
});
