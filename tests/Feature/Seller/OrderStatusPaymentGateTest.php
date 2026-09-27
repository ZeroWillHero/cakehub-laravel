<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\SellerPayoutStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\SellerPayout;
use App\Models\User;

it('blocks a seller from progressing an order until payment is verified', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create([
        'seller_id' => $seller->id,
        'status' => OrderStatus::Placed,
        'payment_status' => PaymentStatus::AwaitingVerification,
    ]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);

    expect($order->fresh()->status)->toBe(OrderStatus::Placed);
});

it('lets a seller progress an order once payment is verified', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create([
        'seller_id' => $seller->id,
        'status' => OrderStatus::Placed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed');
});

it('auto-creates a pending seller payout when an order is marked completed', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create([
        'seller_id' => $seller->id,
        'status' => OrderStatus::Delivered,
        'payment_status' => PaymentStatus::Paid,
        'total' => 42.50,
    ]);

    $this->actingAs($seller->user)
        ->patchJson("/api/seller/orders/{$order->id}/status", ['status' => 'completed'])
        ->assertOk();

    $payout = SellerPayout::query()->where('order_id', $order->id)->first();
    expect($payout)->not->toBeNull();
    expect($payout->status)->toBe(SellerPayoutStatus::Pending);
    expect((float) $payout->amount)->toBe(42.50);
});

it('does not duplicate the payout if the order is somehow completed twice', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create([
        'seller_id' => $seller->id,
        'status' => OrderStatus::Delivered,
        'payment_status' => PaymentStatus::Paid,
    ]);
    SellerPayout::factory()->for($order)->for($seller)->create();

    expect(SellerPayout::query()->where('order_id', $order->id)->count())->toBe(1);
});
