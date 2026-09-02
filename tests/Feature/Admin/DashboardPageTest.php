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
