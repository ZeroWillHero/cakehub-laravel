<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\User;

// A6 Orders Oversight (docs/screens.md) — Phase 12.

it('lists every order for an admin, newest first, with pagination meta', function () {
    $admin = User::factory()->admin()->create();
    $older = Order::factory()->create(['created_at' => now()->subDays(2)]);
    $newer = Order::factory()->create(['created_at' => now()->subDay()]);

    $this->actingAs($admin)->get('/admin/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Orders')
            ->has('orders.data', 2)
            ->where('orders.data.0.id', $newer->id)
            ->where('orders.data.1.id', $older->id)
            ->has('orders.data.0.customer.name')
            ->has('orders.data.0.seller.business_name')
            ->has('orders.data.0.items')
            ->where('orders.meta.total', 2)
            ->where('orders.meta.current_page', 1));
});

it('paginates orders 20 to a page', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->create();
    Order::factory()->count(21)->for($seller)->create();

    $this->actingAs($admin)->get('/admin/orders?page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 1)
            ->where('orders.meta.current_page', 2)
            ->where('orders.meta.last_page', 2)
            ->where('orders.meta.from', 21));
});

it('filters orders by status and payment status', function () {
    $admin = User::factory()->admin()->create();
    $match = Order::factory()->create(['status' => OrderStatus::Ready, 'payment_status' => PaymentStatus::Paid]);
    Order::factory()->create(['status' => OrderStatus::Ready, 'payment_status' => PaymentStatus::Pending]);
    Order::factory()->create(['status' => OrderStatus::Placed, 'payment_status' => PaymentStatus::Paid]);

    $this->actingAs($admin)->get('/admin/orders?status=ready&payment_status=paid')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.id', $match->id)
            ->where('filters.status', 'ready')
            ->where('filters.payment_status', 'paid'));
});

it('searches orders by order number, customer and seller name', function () {
    $admin = User::factory()->admin()->create();
    $byCustomer = Order::factory()->for(User::factory()->customer()->state(['name' => 'Nimalqz Perera']), 'customer')->create();
    $bySeller = Order::factory()->for(Seller::factory()->state(['business_name' => 'Sugarqz Lab']))->create();
    $other = Order::factory()->create();

    $this->actingAs($admin)->get('/admin/orders?search=nimalqz')
        ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $byCustomer->id));

    $this->actingAs($admin)->get('/admin/orders?search=sugarqz')
        ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $bySeller->id));

    $this->actingAs($admin)->get("/admin/orders?search=%23{$other->id}")
        ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $other->id));
});

it('filters orders by created date range', function () {
    $admin = User::factory()->admin()->create();
    Order::factory()->create(['created_at' => '2026-09-01 10:00:00']);
    $inRange = Order::factory()->create(['created_at' => '2026-09-15 10:00:00']);
    Order::factory()->create(['created_at' => '2026-09-30 10:00:00']);

    $this->actingAs($admin)->get('/admin/orders?from=2026-09-10&to=2026-09-20')
        ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $inRange->id));
});

it('deep-links to one customer or one seller\'s orders', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create();
    $customerOrder = Order::factory()->for($customer, 'customer')->create();
    $sellerOrder = Order::factory()->for($seller)->create();
    Order::factory()->create();

    $this->actingAs($admin)->get("/admin/orders?customer={$customer->id}")
        ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $customerOrder->id));

    $this->actingAs($admin)->get("/admin/orders?seller={$seller->id}")
        ->assertInertia(fn ($page) => $page->has('orders.data', 1)->where('orders.data.0.id', $sellerOrder->id));
});

it('ignores invalid filter values instead of erroring', function () {
    $admin = User::factory()->admin()->create();
    Order::factory()->count(2)->create();

    $this->actingAs($admin)->get('/admin/orders?status=bogus&payment_status=nope&from=not-a-date&customer=abc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('orders.data', 2)
            ->where('filters.status', null)
            ->where('filters.from', null)
            ->where('filters.customer', null));
});

it('forbids customers and sellers from the admin orders page', function (string $role) {
    $user = User::factory()->{$role}()->create();

    $this->actingAs($user)->get('/admin/orders')->assertForbidden();
})->with(['customer', 'seller']);

it('sends a guest to sign in from the admin orders page', function () {
    $this->get('/admin/orders')->assertRedirect();
});
