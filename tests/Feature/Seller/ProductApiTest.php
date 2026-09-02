<?php

use App\Enums\ProductAvailabilityStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SubscriptionPlan;
use App\Models\User;

beforeEach(function () {
    SubscriptionPlan::factory()->create(['name' => 'Free', 'price' => 0, 'listing_limit' => 5, 'is_active' => true]);
});

it('creates a product for the authenticated seller', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $category = Category::factory()->create();

    $this->actingAs($seller->user)
        ->postJson('/api/seller/products', [
            'name' => 'Chocolate Fudge Cake',
            'description' => 'Rich and moist',
            'base_price' => 25.50,
            'availability_status' => ProductAvailabilityStatus::InStock->value,
            'category_ids' => [$category->id],
            'variants' => [
                ['name' => '1kg', 'price_modifier' => 0, 'is_default' => true],
                ['name' => '2kg', 'price_modifier' => 15, 'is_default' => false],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Chocolate Fudge Cake')
        ->assertJsonCount(2, 'data.variants');

    expect($seller->products()->count())->toBe(1);
});

it('rejects an unauthenticated product create request', function () {
    $category = Category::factory()->create();

    $this->postJson('/api/seller/products', [
        'name' => 'Cake', 'base_price' => 10,
        'availability_status' => ProductAvailabilityStatus::InStock->value,
        'category_ids' => [$category->id],
    ])->assertUnauthorized();
});

it('rejects a customer attempting to use the seller product endpoint', function () {
    $customer = User::factory()->customer()->create();
    $category = Category::factory()->create();

    $this->actingAs($customer)
        ->postJson('/api/seller/products', [
            'name' => 'Cake', 'base_price' => 10,
            'availability_status' => ProductAvailabilityStatus::InStock->value,
            'category_ids' => [$category->id],
        ])->assertForbidden();
});

it('rejects a product create request missing required fields', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();

    $this->actingAs($seller->user)
        ->postJson('/api/seller/products', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'base_price', 'availability_status', 'category_ids']);
});

it('blocks creating a listing once the seller is at their plan limit', function () {
    SubscriptionPlan::query()->where('name', 'Free')->update(['listing_limit' => 1]);
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Product::factory()->for($seller)->create();
    $category = Category::factory()->create();

    $this->actingAs($seller->user)
        ->postJson('/api/seller/products', [
            'name' => 'One Too Many',
            'base_price' => 10,
            'availability_status' => ProductAvailabilityStatus::InStock->value,
            'category_ids' => [$category->id],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['listing_limit']);

    expect($seller->products()->count())->toBe(1);
});

it('allows creating a listing exactly at the boundary of the limit', function () {
    SubscriptionPlan::query()->where('name', 'Free')->update(['listing_limit' => 2]);
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Product::factory()->for($seller)->create();
    $category = Category::factory()->create();

    $this->actingAs($seller->user)
        ->postJson('/api/seller/products', [
            'name' => 'Second Listing',
            'base_price' => 10,
            'availability_status' => ProductAvailabilityStatus::InStock->value,
            'category_ids' => [$category->id],
        ])
        ->assertCreated();

    expect($seller->products()->count())->toBe(2);
});

it('lets a seller update their own product', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create(['name' => 'Old Name']);
    $category = Category::factory()->create();

    $this->actingAs($seller->user)
        ->putJson("/api/seller/products/{$product->id}", [
            'name' => 'New Name',
            'base_price' => 30,
            'availability_status' => ProductAvailabilityStatus::MadeToOrder->value,
            'category_ids' => [$category->id],
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name');
});

it('forbids a seller from updating another seller\'s product', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($sellerA)->create();
    $category = Category::factory()->create();

    $this->actingAs($sellerB->user)
        ->putJson("/api/seller/products/{$product->id}", [
            'name' => 'Hijacked',
            'base_price' => 30,
            'availability_status' => ProductAvailabilityStatus::InStock->value,
            'category_ids' => [$category->id],
        ])
        ->assertForbidden();
});

it('returns not found when updating a nonexistent product', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();

    $this->actingAs($seller->user)
        ->putJson('/api/seller/products/999999', [
            'name' => 'Ghost',
            'base_price' => 10,
            'availability_status' => ProductAvailabilityStatus::InStock->value,
            'category_ids' => [],
        ])
        ->assertNotFound();
});

it('lets a seller delete their own product', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create();

    $this->actingAs($seller->user)
        ->deleteJson("/api/seller/products/{$product->id}")
        ->assertOk();

    expect(Product::query()->find($product->id))->toBeNull();
});

it('forbids deleting another seller\'s product', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($sellerA)->create();

    $this->actingAs($sellerB->user)
        ->deleteJson("/api/seller/products/{$product->id}")
        ->assertForbidden();

    expect(Product::query()->find($product->id))->not->toBeNull();
});
