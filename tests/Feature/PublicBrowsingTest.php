<?php

use App\Enums\VerificationStatus;
use App\Models\Product;
use App\Models\Seller;
use App\Models\SubscriptionPlan;
use App\Models\User;
use MatanYadaev\EloquentSpatial\Objects\Point;

// docs/plan-public-browsing-guest-cart.md — guests can browse without an
// account, and only verified sellers are publicly visible.

it('shows the customer home to a guest', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Home')
            ->has('categories')
            ->has('featuredSellers')
            ->where('auth.user', null));
});

it('shows active subscription plans to a guest on the home page', function () {
    SubscriptionPlan::factory()->create(['is_active' => true]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/Home')->has('subscriptionPlans', 1));
});

it('sends no subscription plans to a signed-in customer on the home page', function () {
    SubscriptionPlan::factory()->create(['is_active' => true]);
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/Home')->has('subscriptionPlans', 0));
});

it('lets a guest open the search and all-products pages', function () {
    $this->get('/search')->assertOk()->assertInertia(fn ($page) => $page->component('Customer/SearchResults'));
    $this->get('/products')->assertOk()->assertInertia(fn ($page) => $page->component('Customer/Products'));
});

it('lets a guest open a verified seller storefront and product page', function () {
    $seller = Seller::factory()->verified()->create(['business_name' => 'Cake Corner']);
    $product = Product::factory()->for($seller)->create();

    $this->get("/sellers/{$seller->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Storefront')
            ->where('seller.business_name', 'Cake Corner')
            ->has('products', 1));

    $this->get("/sellers/{$seller->slug}/products/{$product->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/ProductDetail')
            ->where('product.id', $product->id));
});

it('hides a non-verified seller storefront and products from guests and customers', function (VerificationStatus $status) {
    $seller = Seller::factory()->create(['verification_status' => $status]);
    $product = Product::factory()->for($seller)->create();
    $customer = User::factory()->customer()->create();

    $this->get("/sellers/{$seller->slug}")->assertNotFound();
    $this->get("/sellers/{$seller->slug}/products/{$product->id}")->assertNotFound();
    $this->actingAs($customer)->get("/sellers/{$seller->slug}")->assertNotFound();
    $this->actingAs($customer)->get("/sellers/{$seller->slug}/products/{$product->id}")->assertNotFound();
})->with([
    'pending' => VerificationStatus::Pending,
    'rejected' => VerificationStatus::Rejected,
    'suspended' => VerificationStatus::Suspended,
]);

it('returns not found for a deactivated product on the public product page', function () {
    $seller = Seller::factory()->verified()->create();
    $product = Product::factory()->for($seller)->create(['is_active' => false]);

    $this->get("/sellers/{$seller->slug}/products/{$product->id}")->assertNotFound();
});

it('lets a seller browse the public pages but not reach the cart', function () {
    $sellerUser = User::factory()->seller()->create();
    Seller::factory()->for($sellerUser)->create();
    $other = Seller::factory()->verified()->create();

    $this->actingAs($sellerUser)->get('/search')->assertOk();
    $this->actingAs($sellerUser)->get("/sellers/{$other->slug}")->assertOk();
    $this->actingAs($sellerUser)->get('/cart')->assertForbidden();
});

it('sends a signed-in user with no role from the cart to onboarding', function () {
    $user = User::factory()->create(['role' => null]);

    $this->actingAs($user)->get('/cart')->assertRedirect(route('onboarding.show'));
});

it('still sends a guest to Google sign-in at checkout and remembers checkout as the destination', function () {
    $this->get('/checkout')
        ->assertRedirect(route('auth.google.redirect'))
        ->assertSessionHas('url.intended', url('/checkout'));
});

it('shares the signed-in user role with the frontend', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->get('/')
        ->assertInertia(fn ($page) => $page->where('auth.user.role', 'customer'));
});

it('excludes non-verified sellers from the public seller search', function () {
    Seller::factory()->verified()->create(['business_name' => 'Verified Bakes']);
    Seller::factory()->create(['business_name' => 'Pending Bakes']);
    Seller::factory()->create(['business_name' => 'Suspended Bakes', 'verification_status' => VerificationStatus::Suspended]);

    $response = $this->getJson('/api/sellers/search')->assertOk();

    expect(collect($response->json('data'))->pluck('business_name')->all())->toBe(['Verified Bakes']);
});

it('excludes non-verified sellers from the nearby seller search', function () {
    Seller::factory()->verified()->create(['location' => new Point(6.9271, 79.8612), 'business_name' => 'Verified Bakes']);
    Seller::factory()->create(['location' => new Point(6.9271, 79.8612), 'business_name' => 'Pending Bakes']);

    $response = $this->getJson('/api/sellers/nearby?lat=6.9271&lng=79.8612&radius_km=5')->assertOk();

    expect(collect($response->json('data'))->pluck('business_name')->all())->toBe(['Verified Bakes']);
});

it('excludes non-verified sellers\' products from the public product search', function () {
    Product::factory()->for(Seller::factory()->verified())->create(['name' => 'Visible Cake']);
    Product::factory()->for(Seller::factory())->create(['name' => 'Hidden Cake']);

    $response = $this->getJson('/api/products/search')->assertOk();

    expect(collect($response->json('data'))->pluck('name')->all())->toBe(['Visible Cake']);
});

it('returns not found for a non-verified seller\'s public product listing', function () {
    $seller = Seller::factory()->create();
    Product::factory()->for($seller)->create();

    $this->getJson("/api/sellers/{$seller->slug}/products")->assertNotFound();
});

it('lets an admin browse the public pages but not reach the cart', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->verified()->create();

    $this->actingAs($admin)->get('/search')->assertOk();
    $this->actingAs($admin)->get("/sellers/{$seller->slug}")->assertOk();
    $this->actingAs($admin)->get('/cart')->assertForbidden();
});
