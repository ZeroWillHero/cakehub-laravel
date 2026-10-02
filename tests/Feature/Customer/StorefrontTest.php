<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;

it('shows a seller storefront with active products', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->verified()->create(['business_name' => 'Cake Corner']);
    Product::factory()->for($seller)->create(['is_active' => true, 'name' => 'Red Velvet']);
    Product::factory()->for($seller)->create(['is_active' => false, 'name' => 'Hidden Cake']);

    $response = $this->actingAs($customer)->get("/sellers/{$seller->slug}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Customer/Storefront')
        ->where('seller.business_name', 'Cake Corner')
        ->has('products', 1)
        ->where('products.0.name', 'Red Velvet'));
});

it('returns not found for an unknown seller slug', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)->get('/sellers/does-not-exist')->assertNotFound();
});

it('shows a product detail page scoped to its seller', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->verified()->create();
    $product = Product::factory()->for($seller)->create();

    $this->actingAs($customer)
        ->get("/sellers/{$seller->slug}/products/{$product->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/ProductDetail')
            ->where('product.id', $product->id));
});

it('returns not found when the product does not belong to the given seller', function () {
    $customer = User::factory()->customer()->create();
    $sellerA = Seller::factory()->verified()->create();
    $sellerB = Seller::factory()->verified()->create();
    $product = Product::factory()->for($sellerB)->create();

    $this->actingAs($customer)
        ->get("/sellers/{$sellerA->slug}/products/{$product->id}")
        ->assertNotFound();
});

it('lists a seller\'s active products via the public API, filterable by category', function () {
    $seller = Seller::factory()->verified()->create();
    $categoryA = Category::factory()->create();
    $categoryB = Category::factory()->create();

    $productA = Product::factory()->for($seller)->create(['is_active' => true]);
    $productA->categories()->attach($categoryA);

    $productB = Product::factory()->for($seller)->create(['is_active' => true]);
    $productB->categories()->attach($categoryB);

    $response = $this->getJson("/api/sellers/{$seller->slug}/products?category_id={$categoryA->id}")
        ->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($productA->id);
});
