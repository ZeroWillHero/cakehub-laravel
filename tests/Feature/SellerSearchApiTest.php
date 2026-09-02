<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use MatanYadaev\EloquentSpatial\Objects\Point;

// San Francisco City Hall as the search origin.
const ORIGIN_LAT = 37.7793;
const ORIGIN_LNG = -122.4193;

function pointAtKm(float $km): Point
{
    // Roughly km north of the origin (1 deg latitude ≈ 111km).
    return new Point(ORIGIN_LAT + ($km / 111), ORIGIN_LNG);
}

it('returns sellers within the requested radius, sorted nearest first', function () {
    $near = Seller::factory()->create(['location' => pointAtKm(1), 'business_name' => 'Near Bakery']);
    $mid = Seller::factory()->create(['location' => pointAtKm(4), 'business_name' => 'Mid Bakery']);
    Seller::factory()->create(['location' => pointAtKm(20), 'business_name' => 'Far Bakery']);

    $response = $this->getJson('/api/sellers/nearby?lat='.ORIGIN_LAT.'&lng='.ORIGIN_LNG.'&radius_km=5')
        ->assertOk();

    $names = collect($response->json('data'))->pluck('business_name');
    expect($names->all())->toBe(['Near Bakery', 'Mid Bakery']);
    expect($response->json('data.0.distance_km'))->toBeLessThan($response->json('data.1.distance_km'));
});

it('excludes sellers outside the radius', function () {
    Seller::factory()->create(['location' => pointAtKm(50)]);

    $this->getJson('/api/sellers/nearby?lat='.ORIGIN_LAT.'&lng='.ORIGIN_LNG.'&radius_km=5')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('excludes sellers with no location set', function () {
    Seller::factory()->create(['location' => null]);

    $this->getJson('/api/sellers/nearby?lat='.ORIGIN_LAT.'&lng='.ORIGIN_LNG.'&radius_km=50')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('filters nearby sellers by category', function () {
    $categoryA = Category::factory()->create();
    $categoryB = Category::factory()->create();

    $sellerA = Seller::factory()->create(['location' => pointAtKm(1)]);
    Product::factory()->for($sellerA)->create()->categories()->attach($categoryA);

    $sellerB = Seller::factory()->create(['location' => pointAtKm(2)]);
    Product::factory()->for($sellerB)->create()->categories()->attach($categoryB);

    $response = $this->getJson(
        '/api/sellers/nearby?lat='.ORIGIN_LAT.'&lng='.ORIGIN_LNG.'&radius_km=10&category_id='.$categoryA->id
    )->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.id'))->toBe($sellerA->id);
});

it('rejects a nearby request missing coordinates', function () {
    $this->getJson('/api/sellers/nearby')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['lat', 'lng']);
});

it('rejects out-of-range coordinates', function () {
    $this->getJson('/api/sellers/nearby?lat=200&lng=200')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['lat', 'lng']);
});

it('searches sellers by business name', function () {
    Seller::factory()->create(['business_name' => 'Chocolate Dreams']);
    Seller::factory()->create(['business_name' => 'Vanilla Sky']);

    $response = $this->getJson('/api/sellers/search?q=chocolate')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data.0.business_name'))->toBe('Chocolate Dreams');
});

it('returns all sellers when search has no query or category', function () {
    Seller::factory()->count(3)->create();

    $this->getJson('/api/sellers/search')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});
