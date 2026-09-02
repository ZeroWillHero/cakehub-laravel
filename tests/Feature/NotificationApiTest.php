<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\User;
use App\Notifications\OrderStatusUpdated;
use Illuminate\Support\Facades\Notification;

it('notifies the seller when a customer places an order', function () {
    Notification::fake();

    $customer = User::factory()->customer()->create();
    $sellerUser = User::factory()->seller()->create();
    $seller = Seller::factory()->for($sellerUser, 'user')->create();
    $product = \App\Models\Product::factory()->for($seller)->create();
    $customer->cartItems()->create([
        'seller_id' => $seller->id,
        'product_id' => $product->id,
        'quantity' => 1,
    ]);

    $this->actingAs($customer)->postJson('/api/checkout', [
        'delivery_type' => 'pickup',
        'scheduled_at' => now()->addDay()->toIso8601String(),
    ])->assertCreated();

    Notification::assertSentTo($sellerUser, OrderStatusUpdated::class);
});

it('notifies the customer when a seller updates order status', function () {
    Notification::fake();

    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($seller)->for($customer, 'customer')->create(['status' => OrderStatus::Placed]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertOk();

    Notification::assertSentTo($customer, OrderStatusUpdated::class);
});

it('lists the authenticated user\'s notifications with an unread count', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create();
    $customer->notify(new OrderStatusUpdated($order));

    $response = $this->actingAs($customer)->getJson('/api/notifications')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('meta.unread_count'))->toBe(1);
});

it('marks a single notification as read', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create();
    $customer->notify(new OrderStatusUpdated($order));
    $notificationId = $customer->notifications()->first()->id;

    $this->actingAs($customer)
        ->patchJson("/api/notifications/{$notificationId}/read")
        ->assertOk();

    expect($customer->unreadNotifications()->count())->toBe(0);
});

it('marks all notifications as read', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create();
    $customer->notify(new OrderStatusUpdated($order));
    $customer->notify(new OrderStatusUpdated($order));

    $this->actingAs($customer)
        ->patchJson('/api/notifications/read-all')
        ->assertOk()
        ->assertJsonPath('data.unread_count', 0);

    expect($customer->unreadNotifications()->count())->toBe(0);
});

it('rejects an unauthenticated notifications request', function () {
    $this->getJson('/api/notifications')->assertUnauthorized();
});
