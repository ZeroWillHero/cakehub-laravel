<?php

use App\Enums\AdStatus;
use App\Models\Ad;
use App\Models\User;

it('includes an active ad within its date range on the customer home page', function () {
    $customer = User::factory()->customer()->create();
    $ad = Ad::factory()->create([
        'name' => 'Visible Ad',
        'status' => AdStatus::Active,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDay(),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Home')
            ->has('ads', 1)
            ->where('ads.0.id', $ad->id)
            ->has('adRotationSeconds')
        );
});

it('excludes a draft ad from the customer home page even if dates match', function () {
    $customer = User::factory()->customer()->create();
    Ad::factory()->create([
        'status' => AdStatus::Draft,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDay(),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/Home')->has('ads', 0));
});

it('excludes a paused ad from the customer home page even if dates match', function () {
    $customer = User::factory()->customer()->create();
    Ad::factory()->create([
        'status' => AdStatus::Paused,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDay(),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/Home')->has('ads', 0));
});

it('excludes an active ad whose date range has not started yet', function () {
    $customer = User::factory()->customer()->create();
    Ad::factory()->create([
        'status' => AdStatus::Active,
        'starts_at' => now()->addDay(),
        'ends_at' => now()->addDays(5),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/Home')->has('ads', 0));
});

it('excludes an active ad whose date range has already ended', function () {
    $customer = User::factory()->customer()->create();
    Ad::factory()->create([
        'status' => AdStatus::Active,
        'starts_at' => now()->subDays(10),
        'ends_at' => now()->subDay(),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Customer/Home')->has('ads', 0));
});

it('includes an active ad whose starts_at is exactly today (inclusive boundary)', function () {
    $customer = User::factory()->customer()->create();
    $ad = Ad::factory()->create([
        'status' => AdStatus::Active,
        'starts_at' => now()->startOfDay(),
        'ends_at' => now()->addDays(3),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Home')
            ->has('ads', 1)
            ->where('ads.0.id', $ad->id)
        );
});

it('includes an active ad whose ends_at is exactly today (inclusive boundary)', function () {
    $customer = User::factory()->customer()->create();
    $ad = Ad::factory()->create([
        'status' => AdStatus::Active,
        'starts_at' => now()->subDays(3),
        'ends_at' => now()->endOfDay(),
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Home')
            ->has('ads', 1)
            ->where('ads.0.id', $ad->id)
        );
});

it('orders eligible ads by sort_order on the customer home page', function () {
    $customer = User::factory()->customer()->create();
    $second = Ad::factory()->create([
        'status' => AdStatus::Active,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDay(),
        'sort_order' => 1,
    ]);
    $first = Ad::factory()->create([
        'status' => AdStatus::Active,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDay(),
        'sort_order' => 0,
    ]);

    $this->actingAs($customer)->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Home')
            ->has('ads', 2)
            ->where('ads.0.id', $first->id)
            ->where('ads.1.id', $second->id)
        );
});
