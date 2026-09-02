<?php

use App\Models\Category;
use App\Models\User;

it('lets an admin create a category', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/categories', ['name' => 'Cupcakes'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Cupcakes')
        ->assertJsonPath('data.slug', 'cupcakes')
        ->assertJsonPath('data.is_active', true);
});

it('lets an admin update a category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create(['name' => 'Old name']);

    $this->actingAs($admin)
        ->putJson("/api/admin/categories/{$category->id}", ['name' => 'New name', 'is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.name', 'New name')
        ->assertJsonPath('data.is_active', false);
});

it('rejects a category being set as its own parent', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create();

    $this->actingAs($admin)
        ->putJson("/api/admin/categories/{$category->id}", ['parent_id' => $category->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['parent_id']);
});

it('lets an admin delete a category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/categories/{$category->id}")
        ->assertOk();

    expect(Category::query()->find($category->id))->toBeNull();
});

it('lets an admin reorder categories', function () {
    $admin = User::factory()->admin()->create();
    $a = Category::factory()->create(['sort_order' => 0]);
    $b = Category::factory()->create(['sort_order' => 1]);

    $this->actingAs($admin)
        ->patchJson('/api/admin/categories/reorder', ['order' => [$b->id, $a->id]])
        ->assertOk();

    expect($a->fresh()->sort_order)->toBe(1);
    expect($b->fresh()->sort_order)->toBe(0);
});

it('forbids a non-admin from creating a category', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->postJson('/api/admin/categories', ['name' => 'Cupcakes'])
        ->assertForbidden();
});

it('rejects an unauthenticated category creation', function () {
    $this->postJson('/api/admin/categories', ['name' => 'Cupcakes'])->assertUnauthorized();
});

it('rejects an empty category name', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/categories', ['name' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('renders the admin categories page', function () {
    $admin = User::factory()->admin()->create();
    Category::factory()->count(2)->create();

    $this->actingAs($admin)->get('/admin/categories')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Categories')->has('categories', 2));
});
