<?php

use App\Models\Seller;
use App\Models\User;

it('redirects unauthenticated users to the google oauth flow when hitting a protected route', function () {
    $this->get('/seller/dashboard')
        ->assertRedirect(route('auth.google.redirect'));
});

it('redirects a logged-in user with no role yet to onboarding', function () {
    $user = User::factory()->create(['role' => null]);

    $this->actingAs($user)
        ->get('/seller/dashboard')
        ->assertRedirect(route('onboarding.show'));
});

it('allows a customer to reach the customer account page', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->get('/account')
        ->assertOk();
});

it('forbids a customer from reaching seller-only routes', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->get('/seller/dashboard')
        ->assertForbidden();
});

it('forbids a seller from reaching admin-only routes', function () {
    $user = User::factory()->seller()->create();
    Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->get('/admin/dashboard')
        ->assertForbidden();
});

it('allows an admin to reach the admin dashboard', function () {
    $user = User::factory()->admin()->create();

    $this->actingAs($user)
        ->get('/admin/dashboard')
        ->assertOk();
});
