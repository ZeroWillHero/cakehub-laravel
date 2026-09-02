<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Models\Seller;
use App\Models\User;

it('lets a customer review their own completed order', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $order = Order::factory()->for($customer, 'customer')->for($seller)->create(['status' => OrderStatus::Completed]);

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 5, 'comment' => 'Delicious!'])
        ->assertCreated()
        ->assertJsonPath('data.rating', 5)
        ->assertJsonPath('data.comment', 'Delicious!');

    expect($seller->fresh()->average_rating)->toEqual(5.0);
});

it('rejects reviewing an order that is not completed', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create(['status' => OrderStatus::Placed]);

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 5])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order']);
});

it('rejects reviewing an order twice', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create(['status' => OrderStatus::Completed]);
    Review::factory()->for($order)->create(['customer_id' => $customer->id, 'seller_id' => $order->seller_id]);

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 3])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order']);
});

it('rejects a rating outside 1-5', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create(['status' => OrderStatus::Completed]);

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 6])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rating']);
});

it('forbids reviewing another customer\'s order', function () {
    $owner = User::factory()->customer()->create();
    $intruder = User::factory()->customer()->create();
    $order = Order::factory()->for($owner, 'customer')->create(['status' => OrderStatus::Completed]);

    $this->actingAs($intruder)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 5])
        ->assertForbidden();
});

it('rejects an unauthenticated review', function () {
    $order = Order::factory()->create(['status' => OrderStatus::Completed]);

    $this->postJson("/api/orders/{$order->id}/reviews", ['rating' => 5])
        ->assertUnauthorized();
});
