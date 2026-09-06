<?php

use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;

it('checks out a cart into an order with pickup', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create(['base_price' => 15]);
    $customer->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 2]);

    $response = $this->actingAs($customer)
        ->postJson('/api/checkout', [
            'delivery_type' => 'pickup',
            'scheduled_at' => now()->addDay()->toIso8601String(),
        ])
        ->assertCreated();

    $response->assertJsonPath('data.total', 30);
    $response->assertJsonPath('data.payment_status', PaymentStatus::Pending->value);
    $response->assertJsonCount(1, 'data.items');

    expect($customer->cartItems()->count())->toBe(0);
    expect($customer->orders()->count())->toBe(1);
});

it('requires a delivery address when delivery_type is delivery', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $customer->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($customer)
        ->postJson('/api/checkout', [
            'delivery_type' => 'delivery',
            'scheduled_at' => now()->addDay()->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['delivery_address_id']);
});

it('rejects checkout with an empty cart', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/checkout', [
            'delivery_type' => 'pickup',
            'scheduled_at' => now()->addDay()->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['cart']);
});

it('rejects checkout with a past scheduled time', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $customer->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($customer)
        ->postJson('/api/checkout', [
            'delivery_type' => 'pickup',
            'scheduled_at' => now()->subDay()->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['scheduled_at']);
});

it('rejects checkout using another customer\'s address', function () {
    $customer = User::factory()->customer()->create();
    $otherCustomer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $customer->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 1]);
    $otherAddress = Address::factory()->for($otherCustomer, 'user')->create();

    $this->actingAs($customer)
        ->postJson('/api/checkout', [
            'delivery_type' => 'delivery',
            'delivery_address_id' => $otherAddress->id,
            'scheduled_at' => now()->addDay()->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['delivery_address_id']);
});

it('rejects an unauthenticated checkout request', function () {
    $this->postJson('/api/checkout', [
        'delivery_type' => 'pickup',
        'scheduled_at' => now()->addDay()->toIso8601String(),
    ])->assertUnauthorized();
});
