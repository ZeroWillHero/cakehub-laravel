<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;

it('lets a customer review a specific order item and updates the product average rating', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $order = Order::factory()->for($customer, 'customer')->for($seller)->create(['status' => OrderStatus::Completed]);
    $item = OrderItem::factory()->for($order)->for($product)->create();

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", [
            'rating' => 4,
            'comment' => 'Great flavor',
            'order_item_id' => $item->id,
        ])
        ->assertCreated()
        ->assertJsonPath('data.order_item_id', $item->id)
        ->assertJsonPath('data.product_id', $product->id);

    expect($product->fresh()->average_rating)->toEqual(4.0);
});

it('lets a customer leave both an overall review and a per-item review on the same order', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $order = Order::factory()->for($customer, 'customer')->for($seller)->create(['status' => OrderStatus::Completed]);
    $item = OrderItem::factory()->for($order)->for($product)->create();

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 5])
        ->assertCreated();

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 3, 'order_item_id' => $item->id])
        ->assertCreated();

    expect($order->fresh()->reviews)->toHaveCount(2);
});

it('rejects reviewing the same order item twice', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $order = Order::factory()->for($customer, 'customer')->for($seller)->create(['status' => OrderStatus::Completed]);
    $item = OrderItem::factory()->for($order)->for($product)->create();

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 4, 'order_item_id' => $item->id])
        ->assertCreated();

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 2, 'order_item_id' => $item->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order_item_id']);
});

it('rejects reviewing an order item that does not belong to the order', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create(['status' => OrderStatus::Completed]);
    $otherItem = OrderItem::factory()->create();

    $this->actingAs($customer)
        ->postJson("/api/orders/{$order->id}/reviews", ['rating' => 4, 'order_item_id' => $otherItem->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order_item_id']);
});

it('shows product reviews and average rating on the product detail page', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create(['average_rating' => 4.5]);
    $order = Order::factory()->for($customer, 'customer')->for($seller)->create(['status' => OrderStatus::Completed]);
    $item = OrderItem::factory()->for($order)->for($product)->create();
    \App\Models\Review::factory()->for($order)->create([
        'customer_id' => $customer->id,
        'seller_id' => $seller->id,
        'order_item_id' => $item->id,
        'product_id' => $product->id,
        'rating' => 5,
    ]);

    $this->actingAs($customer)
        ->get("/sellers/{$seller->slug}/products/{$product->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/ProductDetail')
            ->where('product.average_rating', 4.5)
            ->has('product.reviews', 1)
        );
});
