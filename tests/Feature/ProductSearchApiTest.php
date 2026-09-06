<?php

use App\Enums\ProductAvailabilityStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use MatanYadaev\EloquentSpatial\Objects\Point;

// San Francisco City Hall as the search origin.
const PRODUCT_ORIGIN_LAT = 37.7793;
const PRODUCT_ORIGIN_LNG = -122.4193;

function productPointAtKm(float $km): Point
{
    return new Point(PRODUCT_ORIGIN_LAT + ($km / 111), PRODUCT_ORIGIN_LNG);
}

it('returns active products with seller info', function () {
    $seller = Seller::factory()->create(['business_name' => 'Chocolate Dreams']);
    Product::factory()->for($seller)->create(['name' => 'Fudge Cake']);

    $response = $this->getJson('/api/products/search')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Fudge Cake');
    expect($response->json('data.0.seller.business_name'))->toBe('Chocolate Dreams');
});

it('excludes inactive products', function () {
    $seller = Seller::factory()->create();
    Product::factory()->for($seller)->create(['is_active' => false]);

    $this->getJson('/api/products/search')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('searches products by title', function () {
    $seller = Seller::factory()->create();
    Product::factory()->for($seller)->create(['name' => 'Red Velvet Cake']);
    Product::factory()->for($seller)->create(['name' => 'Lemon Tart']);

    $response = $this->getJson('/api/products/search?q=velvet')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Red Velvet Cake');
});

it('searches products by seller business name', function () {
    $matching = Seller::factory()->create(['business_name' => 'Sweet Layers Bakery']);
    Product::factory()->for($matching)->create(['name' => 'Any Cake']);

    $other = Seller::factory()->create(['business_name' => 'Other Bakery']);
    Product::factory()->for($other)->create(['name' => 'Another Cake']);

    $response = $this->getJson('/api/products/search?q=sweet+layers')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Any Cake');
});

it('filters products by category', function () {
    $categoryA = Category::factory()->create();
    $categoryB = Category::factory()->create();
    $seller = Seller::factory()->create();

    $inCategory = Product::factory()->for($seller)->create();
    $inCategory->categories()->attach($categoryA);

    $outOfCategory = Product::factory()->for($seller)->create();
    $outOfCategory->categories()->attach($categoryB);

    $response = $this->getJson('/api/products/search?category_id='.$categoryA->id)->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($inCategory->id);
});

it('filters products to in-stock only when requested', function () {
    $seller = Seller::factory()->create();
    $inStock = Product::factory()->for($seller)->create(['availability_status' => ProductAvailabilityStatus::InStock]);
    Product::factory()->for($seller)->create(['availability_status' => ProductAvailabilityStatus::Unavailable]);

    $response = $this->getJson('/api/products/search?in_stock=1')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($inStock->id);
});

it('includes made-to-order and unavailable products when in_stock is not set', function () {
    $seller = Seller::factory()->create();
    Product::factory()->for($seller)->create(['availability_status' => ProductAvailabilityStatus::InStock]);
    Product::factory()->for($seller)->create(['availability_status' => ProductAvailabilityStatus::MadeToOrder]);
    Product::factory()->for($seller)->create(['availability_status' => ProductAvailabilityStatus::Unavailable]);

    $this->getJson('/api/products/search')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('returns products within the requested radius, sorted by seller distance', function () {
    $near = Seller::factory()->create(['location' => productPointAtKm(1)]);
    Product::factory()->for($near)->create(['name' => 'Near Cake']);

    $far = Seller::factory()->create(['location' => productPointAtKm(20)]);
    Product::factory()->for($far)->create(['name' => 'Far Cake']);

    $response = $this->getJson(
        '/api/products/search?lat='.PRODUCT_ORIGIN_LAT.'&lng='.PRODUCT_ORIGIN_LNG.'&radius_km=5'
    )->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.name'))->toBe('Near Cake');
    expect($response->json('data.0.distance_km'))->not->toBeNull();
});

it('excludes products from sellers with no location when filtering by radius', function () {
    $seller = Seller::factory()->create(['location' => null]);
    Product::factory()->for($seller)->create();

    $this->getJson('/api/products/search?lat='.PRODUCT_ORIGIN_LAT.'&lng='.PRODUCT_ORIGIN_LNG.'&radius_km=50')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('rejects lat without lng', function () {
    $this->getJson('/api/products/search?lat='.PRODUCT_ORIGIN_LAT)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['lng']);
});

it('rejects out-of-range coordinates', function () {
    $this->getJson('/api/products/search?lat=200&lng=200')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['lat', 'lng']);
});

it('rejects an unknown category id', function () {
    $this->getJson('/api/products/search?category_id=999999')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category_id']);
});

it('returns an empty list rather than an error when nothing matches', function () {
    $this->getJson('/api/products/search?q=nonexistent-cake-flavor')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});
