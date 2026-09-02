<?php

use App\Models\Order;
use App\Models\Seller;
use App\Models\User;

it('renders the customer order history page', function () {
    $customer = User::factory()->customer()->create();
    Order::factory()->for($customer, 'customer')->create();

    $this->actingAs($customer)->get('/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/OrderHistory')->has('orders', 1));
});

it('renders the customer order detail page for the owning customer', function () {
    $customer = User::factory()->customer()->create();
    $order = Order::factory()->for($customer, 'customer')->create();

    $this->actingAs($customer)->get("/orders/{$order->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/OrderDetail')->where('order.id', $order->id));
});

it('forbids viewing another customer\'s order', function () {
    $owner = User::factory()->customer()->create();
    $intruder = User::factory()->customer()->create();
    $order = Order::factory()->for($owner, 'customer')->create();

    $this->actingAs($intruder)->get("/orders/{$order->id}")->assertForbidden();
});

it('renders the seller orders page', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Order::factory()->for($seller)->create();

    $this->actingAs($seller->user)->get('/seller/orders')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Seller/Orders')->has('orders', 1));
});
