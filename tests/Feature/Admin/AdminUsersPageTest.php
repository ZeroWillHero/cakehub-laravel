<?php

use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;

// A8 User Management (docs/screens.md) — Phase 12.

it('lists customers by default with their order totals, and never lists admins', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->customer()->create(['name' => 'Asha']);
    $seller = Seller::factory()->create();
    Order::factory()->for($customer, 'customer')->for($seller)->create(['total' => 30]);
    Order::factory()->for($customer, 'customer')->for($seller)->create(['total' => 12.5]);
    User::factory()->customer()->create(['name' => 'No Orders Yet']);

    $this->actingAs($admin)->get('/admin/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users')
            ->where('filters.tab', 'customers')
            ->has('users.data', 2)
            ->where('counts.customers', 2)
            ->where('counts.sellers', 1)
            ->where('users.data', fn ($rows) => collect($rows)->pluck('role')->unique()->all() === ['customer']));

    $rows = collect($this->actingAs($admin)->get('/admin/users')->viewData('page')['props']['users']['data'])->keyBy('name');
    expect($rows['Asha']['orders_count'])->toBe(2)
        ->and($rows['Asha']['orders_total'])->toBe(42.5)
        ->and($rows['Asha']['last_order_at'])->not->toBeNull()
        ->and($rows['No Orders Yet']['orders_total'])->toBe(0.0)
        ->and($rows['No Orders Yet']['last_order_at'])->toBeNull();
});

it('lists sellers with their store summary on the sellers tab', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->verified()->create(['business_name' => 'Cake Corner']);
    Product::factory()->count(3)->for($seller)->create();
    Order::factory()->for($seller)->create();
    User::factory()->customer()->create();

    $this->actingAs($admin)->get('/admin/users?tab=sellers')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.tab', 'sellers')
            ->has('users.data', 1)
            ->where('users.data.0.role', 'seller')
            ->where('users.data.0.seller.business_name', 'Cake Corner')
            ->where('users.data.0.seller.verification_status', 'verified')
            ->where('users.data.0.seller.products_count', 3)
            ->where('users.data.0.seller.orders_count', 1));
});

it('searches users by name or email, and sellers by business name', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->customer()->create(['name' => 'Kamal Silva', 'email' => 'kamal@example.com']);
    User::factory()->customer()->create(['name' => 'Other Person', 'email' => 'someone@example.com']);
    // Fixed owner names/emails so random Faker data can't match the searches.
    Seller::factory()->for(User::factory()->seller()->state(['name' => 'Owner One', 'email' => 'one@shop.test']), 'user')
        ->create(['business_name' => 'Rose Bakes']);
    Seller::factory()->for(User::factory()->seller()->state(['name' => 'Owner Two', 'email' => 'two@shop.test']), 'user')
        ->create(['business_name' => 'Choco Hut']);

    $this->actingAs($admin)->get('/admin/users?search=KAMAL')
        ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.name', 'Kamal Silva'));

    $this->actingAs($admin)->get('/admin/users?search=someone@')
        ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.name', 'Other Person'));

    $this->actingAs($admin)->get('/admin/users?tab=sellers&search=rose')
        ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.seller.business_name', 'Rose Bakes'));
});

it('filters by account status and, on the sellers tab, by verification status', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->customer()->create(['status' => UserStatus::Suspended, 'name' => 'Suspended One']);
    User::factory()->customer()->create();
    Seller::factory()->verified()->create(['business_name' => 'Verified Co']);
    Seller::factory()->create(['business_name' => 'Pending Co', 'verification_status' => VerificationStatus::Pending]);

    $this->actingAs($admin)->get('/admin/users?status=suspended')
        ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.name', 'Suspended One'));

    $this->actingAs($admin)->get('/admin/users?tab=sellers&verification=pending')
        ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('users.data.0.seller.business_name', 'Pending Co'));
});

it('ignores the verification filter on the customers tab', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->customer()->create();

    $this->actingAs($admin)->get('/admin/users?verification=pending')
        ->assertInertia(fn ($page) => $page->has('users.data', 1)->where('filters.verification', null));
});

it('forbids customers and sellers from the admin users page', function (string $role) {
    $user = User::factory()->{$role}()->create();

    $this->actingAs($user)->get('/admin/users')->assertForbidden();
})->with(['customer', 'seller']);

it('sends a guest to sign in from the admin users page', function () {
    $this->get('/admin/users')->assertRedirect();
});

it('falls back to the customers tab and ignores invalid filters', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->customer()->count(2)->create();

    $this->actingAs($admin)->get('/admin/users?tab=bogus&status=nope&verification=nope')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.tab', 'customers')
            ->where('filters.status', null)
            ->where('filters.verification', null)
            ->has('users.data', 2));
});

it('treats % and _ in a search as literal characters', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->customer()->count(2)->create();

    $this->actingAs($admin)->get('/admin/users?search=%25')
        ->assertInertia(fn ($page) => $page->has('users.data', 0));

    $this->actingAs($admin)->get('/admin/users?search=_')
        ->assertInertia(fn ($page) => $page->has('users.data', 0));
});
