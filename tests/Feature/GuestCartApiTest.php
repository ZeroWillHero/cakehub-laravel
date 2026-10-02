<?php

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Seller;
use App\Models\User;
use App\Services\GuestCart;

// The guest cart lives in the session, which the API only starts for
// requests from the SPA's own domain (Sanctum stateful API) — hence the
// pinned stateful domain and Referer header on every request here.
beforeEach(function () {
    config(['sanctum.stateful' => ['localhost']]);
    $this->withHeader('Referer', 'http://localhost');
});

it('adds a product to an empty guest cart', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create(['base_price' => 20]);

    $this->postJson('/api/guest-cart', ['product_id' => $product->id, 'customization_notes' => 'Happy birthday'])
        ->assertCreated()
        ->assertJsonPath('data.id', 1)
        ->assertJsonPath('data.product_id', $product->id)
        ->assertJsonPath('data.unit_price', 20)
        ->assertJsonPath('data.customization_notes', 'Happy birthday');

    $this->getJson('/api/guest-cart')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.product_name', $product->name);
});

it('applies the variant price modifier to a guest cart line', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create(['base_price' => 20]);
    $variant = ProductVariant::factory()->for($product)->create(['price_modifier' => 5]);

    $this->postJson('/api/guest-cart', ['product_id' => $product->id, 'product_variant_id' => $variant->id])
        ->assertCreated()
        ->assertJsonPath('data.unit_price', 25);
});

it('rejects a variant that belongs to a different product', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    $otherVariant = ProductVariant::factory()->create();

    $this->postJson('/api/guest-cart', ['product_id' => $product->id, 'product_variant_id' => $otherVariant->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['product_variant_id']);
});

it('rejects a product from a non-verified seller', function () {
    $product = Product::factory()->for(Seller::factory())->create();

    $this->postJson('/api/guest-cart', ['product_id' => $product->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['product_id']);
});

it('rejects a nonexistent product', function () {
    $this->postJson('/api/guest-cart', ['product_id' => 999999])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['product_id']);
});

it('warns with a 409 when adding a different seller\'s product without confirming', function () {
    $productA = Product::factory()->for(Seller::factory()->verified())->create();
    $productB = Product::factory()->for(Seller::factory()->verified())->create();

    $this->postJson('/api/guest-cart', ['product_id' => $productA->id])->assertCreated();

    $this->postJson('/api/guest-cart', ['product_id' => $productB->id])
        ->assertStatus(409)
        ->assertJsonValidationErrors(['seller_conflict']);

    $this->getJson('/api/guest-cart')->assertJsonCount(1, 'data')->assertJsonPath('data.0.product_id', $productA->id);
});

it('replaces the guest cart when switching seller with replace_cart confirmed', function () {
    $productA = Product::factory()->for(Seller::factory()->verified())->create();
    $productB = Product::factory()->for(Seller::factory()->verified())->create();

    $this->postJson('/api/guest-cart', ['product_id' => $productA->id])->assertCreated();
    $this->postJson('/api/guest-cart', ['product_id' => $productB->id, 'replace_cart' => true])->assertCreated();

    $this->getJson('/api/guest-cart')->assertJsonCount(1, 'data')->assertJsonPath('data.0.product_id', $productB->id);
});

it('caps the guest cart at the maximum number of lines', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create();

    for ($i = 0; $i < GuestCart::MAX_LINES; $i++) {
        $this->postJson('/api/guest-cart', ['product_id' => $product->id])->assertCreated();
    }

    $this->postJson('/api/guest-cart', ['product_id' => $product->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['cart']);
});

it('updates the quantity of a guest cart line', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create(['base_price' => 10]);
    $this->postJson('/api/guest-cart', ['product_id' => $product->id])->assertCreated();

    $this->putJson('/api/guest-cart/1', ['quantity' => 3])
        ->assertOk()
        ->assertJsonPath('data.quantity', 3)
        ->assertJsonPath('data.line_total', 30);
});

it('rejects an invalid quantity on a guest cart line', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    $this->postJson('/api/guest-cart', ['product_id' => $product->id])->assertCreated();

    $this->putJson('/api/guest-cart/1', ['quantity' => 0])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['quantity']);
});

it('removes a guest cart line', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    $this->postJson('/api/guest-cart', ['product_id' => $product->id])->assertCreated();

    $this->deleteJson('/api/guest-cart/1')->assertOk()->assertJsonPath('data.deleted', true);

    $this->getJson('/api/guest-cart')->assertJsonCount(0, 'data');
});

it('returns not found for an unknown guest cart line', function () {
    $this->putJson('/api/guest-cart/42', ['quantity' => 2])->assertNotFound();
    $this->deleteJson('/api/guest-cart/42')->assertNotFound();
});

it('forbids signed-in users from using the guest cart', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->for(Seller::factory()->verified())->create();

    $this->actingAs($customer)->getJson('/api/guest-cart')->assertForbidden();
    $this->actingAs($customer)->postJson('/api/guest-cart', ['product_id' => $product->id])->assertForbidden();
});

it('rejects a guest cart request that has no browser session', function () {
    $this->withoutHeader('Referer')->getJson('/api/guest-cart')->assertStatus(400);
});

it('shows the guest cart on the cart page', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    $this->postJson('/api/guest-cart', ['product_id' => $product->id])->assertCreated();

    $this->get('/cart')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Cart')
            ->has('items', 1)
            ->where('items.0.product_id', $product->id)
            ->where('pendingMerge', null));
});

it('rejects a deactivated product', function () {
    $product = Product::factory()->for(Seller::factory()->verified())->create(['is_active' => false]);

    $this->postJson('/api/guest-cart', ['product_id' => $product->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['product_id']);
});

it('rate-limits the guest cart endpoints', function () {
    for ($i = 0; $i < 60; $i++) {
        $this->getJson('/api/guest-cart')->assertOk();
    }

    $this->getJson('/api/guest-cart')->assertStatus(429);
});
