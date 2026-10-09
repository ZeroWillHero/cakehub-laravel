<?php

use App\Enums\StoreStatus;
use App\Enums\UserStatus;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;

// A8 suspend/reactivate (docs/screens.md) — Phase 12. Suspending a seller's
// account also hides their store (Seller::publiclyVisible()).

it('lets an admin suspend and then reactivate a customer', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->customer()->create();

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$customer->id}/suspend")
        ->assertOk()
        ->assertJsonPath('data.status', 'suspended')
        ->assertJsonPath('data.orders_count', 0);

    expect($customer->fresh()->status)->toBe(UserStatus::Suspended);

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$customer->id}/reactivate")
        ->assertOk()
        ->assertJsonPath('data.status', 'active');

    expect($customer->fresh()->status)->toBe(UserStatus::Active);
});

it('returns the seller row shape when suspending a seller', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->verified()->create(['business_name' => 'Cake Corner']);

    $this->actingAs($admin)
        ->patchJson("/api/admin/users/{$seller->user_id}/suspend")
        ->assertOk()
        ->assertJsonPath('data.status', 'suspended')
        ->assertJsonPath('data.seller.business_name', 'Cake Corner');
});

it('refuses to suspend or reactivate an admin account', function () {
    $admin = User::factory()->admin()->create();
    $otherAdmin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson("/api/admin/users/{$otherAdmin->id}/suspend")->assertUnprocessable();
    $this->actingAs($admin)->patchJson("/api/admin/users/{$admin->id}/suspend")->assertUnprocessable();

    expect($otherAdmin->fresh()->status)->toBe(UserStatus::Active);
});

it('refuses a transition from the wrong starting status', function () {
    $admin = User::factory()->admin()->create();
    $active = User::factory()->customer()->create();
    $suspended = User::factory()->customer()->create(['status' => UserStatus::Suspended]);
    $deactivated = User::factory()->customer()->create(['status' => UserStatus::Deactivated]);

    $this->actingAs($admin)->patchJson("/api/admin/users/{$active->id}/reactivate")->assertUnprocessable();
    $this->actingAs($admin)->patchJson("/api/admin/users/{$suspended->id}/suspend")->assertUnprocessable();
    // A user's own deactivation isn't the admin's to reverse.
    $this->actingAs($admin)->patchJson("/api/admin/users/{$deactivated->id}/reactivate")->assertUnprocessable();

    expect($deactivated->fresh()->status)->toBe(UserStatus::Deactivated);
});

it('forbids non-admins from suspending users', function (string $role) {
    $actor = User::factory()->{$role}()->create();
    $target = User::factory()->customer()->create();

    $this->actingAs($actor)->patchJson("/api/admin/users/{$target->id}/suspend")->assertForbidden();

    expect($target->fresh()->status)->toBe(UserStatus::Active);
})->with(['customer', 'seller']);

it('returns not found for a missing user', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->patchJson('/api/admin/users/999999/suspend')->assertNotFound();
});

it('locks a suspended customer out on their next request', function () {
    $customer = User::factory()->customer()->create(['status' => UserStatus::Suspended]);

    $this->actingAs($customer)->get('/orders')->assertForbidden();
    $this->assertGuest();
});

it('hides a suspended seller\'s store from public search, storefront and product pages', function () {
    $seller = Seller::factory()->verified()->create(['business_name' => 'Hidden Bakes']);
    $product = Product::factory()->for($seller)->create();
    Seller::factory()->verified()->create(['business_name' => 'Still Visible']);
    $seller->user->update(['status' => UserStatus::Suspended]);

    $names = collect($this->getJson('/api/sellers/search')->assertOk()->json('data'))->pluck('business_name')->all();
    expect($names)->toBe(['Still Visible']);

    $this->get("/sellers/{$seller->slug}")->assertNotFound();
    $this->get("/sellers/{$seller->slug}/products/{$product->id}")->assertNotFound();
});

it('rejects adding a suspended seller\'s product to the cart', function () {
    $seller = Seller::factory()->verified()->create();
    $product = Product::factory()->for($seller)->create();
    $seller->user->update(['status' => UserStatus::Suspended]);
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/cart', ['product_id' => $product->id])
        ->assertUnprocessable();

    expect($customer->cartItems()->count())->toBe(0);
});

it('shows a reactivated seller\'s store again', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->verified()->create();
    $seller->user->update(['status' => UserStatus::Suspended]);

    $this->get("/sellers/{$seller->slug}")->assertNotFound();

    $this->actingAs($admin)->patchJson("/api/admin/users/{$seller->user_id}/reactivate")->assertOk();

    // Admins can view public storefronts, so the same session sees it back.
    $this->get("/sellers/{$seller->slug}")->assertOk();
});

it('rejects an unauthenticated suspend request', function () {
    $target = User::factory()->customer()->create();

    $this->patchJson("/api/admin/users/{$target->id}/suspend")->assertUnauthorized();

    expect($target->fresh()->status)->toBe(UserStatus::Active);
});

it('hides a suspended seller\'s products from public product search', function () {
    $hidden = Seller::factory()->verified()->create();
    Product::factory()->for($hidden)->create(['name' => 'Hidden Cake']);
    Product::factory()->for(Seller::factory()->verified())->create(['name' => 'Visible Cake']);
    $hidden->user->update(['status' => UserStatus::Suspended]);

    $names = collect($this->getJson('/api/products/search')->assertOk()->json('data'))->pluck('name')->all();
    expect($names)->toBe(['Visible Cake']);
});

it('leaves a suspended seller out of the home page featured sellers', function () {
    $hidden = Seller::factory()->verified()->create(['business_name' => 'Hidden Bakes', 'store_status' => StoreStatus::Open]);
    Seller::factory()->verified()->create(['business_name' => 'Still Visible', 'store_status' => StoreStatus::Open]);
    $hidden->user->update(['status' => UserStatus::Suspended]);

    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page
        ->has('featuredSellers', 1)
        ->where('featuredSellers.0.business_name', 'Still Visible'));
});

it('rejects a guest adding a suspended seller\'s product to the guest cart', function () {
    $seller = Seller::factory()->verified()->create();
    $product = Product::factory()->for($seller)->create();
    $seller->user->update(['status' => UserStatus::Suspended]);

    $this->postJson('/api/guest-cart', ['product_id' => $product->id])->assertUnprocessable();
});

it('blocks checkout when the cart already holds a now-suspended seller\'s product', function () {
    $seller = Seller::factory()->verified()->create();
    $product = Product::factory()->for($seller)->create();
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)->postJson('/api/cart', ['product_id' => $product->id])->assertCreated();
    $seller->user->update(['status' => UserStatus::Suspended]);

    // A valid pickup payload, so the only thing that can fail is the seller check.
    $this->actingAs($customer)
        ->postJson('/api/checkout', ['delivery_type' => 'pickup', 'scheduled_at' => now()->addDay()->toIso8601String()])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['cart' => 'not currently accepting orders']);

    expect($customer->orders()->count())->toBe(0);
});
