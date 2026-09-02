<?php

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Seller;
use App\Models\User;

it('adds a product to an empty cart', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create(['base_price' => 20]);

    $this->actingAs($customer)
        ->postJson('/api/cart', ['product_id' => $product->id, 'quantity' => 2])
        ->assertCreated()
        ->assertJsonPath('data.quantity', 2)
        ->assertJsonPath('data.line_total', 40);

    expect($customer->cartItems()->count())->toBe(1);
});

it('adds a variant with its price modifier applied', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create(['base_price' => 20]);
    $variant = ProductVariant::factory()->for($product)->create(['price_modifier' => 5]);

    $this->actingAs($customer)
        ->postJson('/api/cart', ['product_id' => $product->id, 'product_variant_id' => $variant->id])
        ->assertCreated()
        ->assertJsonPath('data.unit_price', 25);
});

it('rejects an unauthenticated add-to-cart request', function () {
    $product = Product::factory()->create();

    $this->postJson('/api/cart', ['product_id' => $product->id])->assertUnauthorized();
});

it('rejects adding a nonexistent product', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/cart', ['product_id' => 999999])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['product_id']);
});

it('warns with a 409 when adding a different seller\'s product without confirming replace', function () {
    $customer = User::factory()->customer()->create();
    $sellerA = Seller::factory()->create();
    $sellerB = Seller::factory()->create();
    $productA = Product::factory()->for($sellerA)->create();
    $productB = Product::factory()->for($sellerB)->create();

    $this->actingAs($customer)->postJson('/api/cart', ['product_id' => $productA->id]);

    $this->actingAs($customer)
        ->postJson('/api/cart', ['product_id' => $productB->id])
        ->assertStatus(409);

    expect($customer->cartItems()->count())->toBe(1);
});

it('replaces the cart when adding a different seller\'s product with replace_cart confirmed', function () {
    $customer = User::factory()->customer()->create();
    $sellerA = Seller::factory()->create();
    $sellerB = Seller::factory()->create();
    $productA = Product::factory()->for($sellerA)->create();
    $productB = Product::factory()->for($sellerB)->create();

    $this->actingAs($customer)->postJson('/api/cart', ['product_id' => $productA->id]);

    $this->actingAs($customer)
        ->postJson('/api/cart', ['product_id' => $productB->id, 'replace_cart' => true])
        ->assertCreated();

    expect($customer->cartItems()->count())->toBe(1);
    expect($customer->cartItems()->first()->product_id)->toBe($productB->id);
});

it('lets a customer update their own cart item quantity', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $item = $customer->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($customer)
        ->putJson("/api/cart/{$item->id}", ['quantity' => 3])
        ->assertOk()
        ->assertJsonPath('data.quantity', 3);
});

it('forbids updating another customer\'s cart item', function () {
    $owner = User::factory()->customer()->create();
    $intruder = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $item = $owner->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($intruder)
        ->putJson("/api/cart/{$item->id}", ['quantity' => 3])
        ->assertForbidden();
});

it('lets a customer remove their own cart item', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $product = Product::factory()->for($seller)->create();
    $item = $customer->cartItems()->create(['seller_id' => $seller->id, 'product_id' => $product->id, 'quantity' => 1]);

    $this->actingAs($customer)
        ->deleteJson("/api/cart/{$item->id}")
        ->assertOk();

    expect($customer->cartItems()->count())->toBe(0);
});
