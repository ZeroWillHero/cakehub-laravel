<?php

use App\Enums\VerificationStatus;
use App\Models\Seller;
use App\Models\User;

it('renders the admin dashboard with metrics', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->customer()->create();
    Seller::factory()->create(['verification_status' => VerificationStatus::Pending]);

    $this->actingAs($admin)->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('metrics.customers', 1)
            ->where('metrics.sellers', 1)
            ->where('metrics.pending_verifications', 1));
});

it('forbids a non-admin from viewing the admin dashboard', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)->get('/admin/dashboard')->assertForbidden();
});

it('includes a 30-day orders/new-sellers analytics series on the admin dashboard', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('analytics.ordersOverTime', 30)
            ->has('analytics.newSellersOverTime', 30)
            ->has('analytics.statusBreakdown'));
});

it('lets an admin download a CSV export of the dashboard stats', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/admin/dashboard/export');

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('text/csv');
});

it('forbids a non-admin from downloading the dashboard export', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)->get('/admin/dashboard/export')->assertForbidden();
});
