<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\User;

it('lets a seller advance their own order to the next valid status', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->for($seller)->create(['status' => OrderStatus::Placed]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed');
});

it('rejects an invalid status transition', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->for($seller)->create(['status' => OrderStatus::Placed]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'delivered'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);

    expect($order->fresh()->status)->toBe(OrderStatus::Placed);
});

it('rejects moving a completed order to any status', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->for($seller)->create(['status' => OrderStatus::Completed]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'placed'])
        ->assertUnprocessable();
});

it('forbids a seller from updating another seller\'s order status', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->for($sellerA)->create(['status' => OrderStatus::Placed]);

    $this->actingAs($sellerB->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertForbidden();
});

it('forbids a customer from updating order status', function () {
    $seller = Seller::factory()->create();
    $order = Order::factory()->for($seller)->create(['status' => OrderStatus::Placed]);
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertForbidden();
});

it('rejects an unauthenticated status update', function () {
    $seller = Seller::factory()->create();
    $order = Order::factory()->for($seller)->create();

    $this->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertUnauthorized();
});
