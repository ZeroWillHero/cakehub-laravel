<?php

use App\Models\Category;
use App\Models\Seller;
use App\Models\User;

it('lets a seller create a category that appears live immediately', function () {
    $user = User::factory()->seller()->create();
    Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson('/api/seller/categories', ['name' => 'Vegan Cakes'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Vegan Cakes')
        ->assertJsonPath('data.slug', 'vegan-cakes')
        ->assertJsonPath('data.is_active', true);

    $category = Category::query()->where('name', 'Vegan Cakes')->firstOrFail();
    expect($category->created_by)->toBe($user->id);
    expect($category->is_active)->toBeTrue();
});

it('rejects a duplicate category name from a seller', function () {
    $user = User::factory()->seller()->create();
    Seller::factory()->for($user)->create();
    Category::factory()->create(['name' => 'Cupcakes']);

    $this->actingAs($user)
        ->postJson('/api/seller/categories', ['name' => 'Cupcakes'])
        ->assertStatus(422);
});

it('forbids a customer from creating a category', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/seller/categories', ['name' => 'Cupcakes'])
        ->assertStatus(403);
});

it('rejects an unauthenticated category creation', function () {
    $this->postJson('/api/seller/categories', ['name' => 'Cupcakes'])
        ->assertStatus(401);
});
