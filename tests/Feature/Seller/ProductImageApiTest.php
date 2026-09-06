<?php

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Seller;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

it('uploads an image for the seller\'s own product', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create();
    $file = UploadedFile::fake()->image('cake.jpg');

    $this->actingAs($seller->user)
        ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
        ->assertCreated()
        ->assertJsonPath('data.sort_order', 0);

    expect($product->images()->count())->toBe(1);
    Storage::disk('public')->assertExists($product->images()->first()->path);
});

it('rejects a non-image file upload', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create();
    $file = UploadedFile::fake()->create('notes.txt', 10);

    $this->actingAs($seller->user)
        ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image']);
});

it('rejects an oversized image upload', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create();
    $file = UploadedFile::fake()->image('big.jpg')->size(11000); // over the 10MB (10240KB) limit

    $this->actingAs($seller->user)
        ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image']);
});

it('forbids uploading an image to another seller\'s product', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($sellerA)->create();
    $file = UploadedFile::fake()->image('cake.jpg');

    $this->actingAs($sellerB->user)
        ->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
        ->assertForbidden();
});

it('rejects an unauthenticated image upload', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create();
    $file = UploadedFile::fake()->image('cake.jpg');

    $this->postJson("/api/seller/products/{$product->id}/images", ['image' => $file])
        ->assertUnauthorized();
});

it('lets a seller delete their own product image', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($seller)->create();
    Storage::disk('public')->put('products/1/existing.jpg', 'fake-content');
    $image = ProductImage::factory()->for($product)->create(['path' => 'products/1/existing.jpg']);

    $this->actingAs($seller->user)
        ->deleteJson("/api/seller/products/{$product->id}/images/{$image->id}")
        ->assertOk();

    expect(ProductImage::query()->find($image->id))->toBeNull();
    Storage::disk('public')->assertMissing('products/1/existing.jpg');
});

it('forbids deleting another seller\'s product image', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $product = Product::factory()->for($sellerA)->create();
    $image = ProductImage::factory()->for($product)->create();

    $this->actingAs($sellerB->user)
        ->deleteJson("/api/seller/products/{$product->id}/images/{$image->id}")
        ->assertForbidden();

    expect(ProductImage::query()->find($image->id))->not->toBeNull();
});

it('returns not found when the image does not belong to the given product', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $productA = Product::factory()->for($seller)->create();
    $productB = Product::factory()->for($seller)->create();
    $image = ProductImage::factory()->for($productB)->create();

    $this->actingAs($seller->user)
        ->deleteJson("/api/seller/products/{$productA->id}/images/{$image->id}")
        ->assertNotFound();
});
