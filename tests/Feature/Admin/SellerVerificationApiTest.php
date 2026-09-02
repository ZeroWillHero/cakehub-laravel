<?php

use App\Enums\VerificationStatus;
use App\Models\Seller;
use App\Models\User;
use App\Notifications\SellerVerificationUpdated;
use Illuminate\Support\Facades\Notification;

it('lets an admin verify a pending seller', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create(['verification_status' => VerificationStatus::Pending]);

    $this->actingAs($admin)
        ->postJson("/api/admin/sellers/{$seller->id}/verify")
        ->assertOk()
        ->assertJsonPath('data.verification_status', 'verified');

    expect($seller->fresh()->verified_by)->toBe($admin->id);
    Notification::assertSentTo($seller->user, SellerVerificationUpdated::class);
});

it('lets an admin reject a seller with a reason', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create(['verification_status' => VerificationStatus::Pending]);

    $this->actingAs($admin)
        ->postJson("/api/admin/sellers/{$seller->id}/reject", ['reason' => 'Documents are illegible.'])
        ->assertOk()
        ->assertJsonPath('data.verification_status', 'rejected');

    Notification::assertSentTo($seller->user, SellerVerificationUpdated::class);
});

it('rejects a seller rejection with no reason', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->create(['verification_status' => VerificationStatus::Pending]);

    $this->actingAs($admin)
        ->postJson("/api/admin/sellers/{$seller->id}/reject", ['reason' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['reason']);
});

it('lets an admin request more info from a seller', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create(['verification_status' => VerificationStatus::Pending]);

    $this->actingAs($admin)
        ->postJson("/api/admin/sellers/{$seller->id}/request-info", ['message' => 'Please upload a food safety certificate.'])
        ->assertOk();

    expect($seller->fresh()->verification_status)->toBe(VerificationStatus::Pending);
    Notification::assertSentTo($seller->user, SellerVerificationUpdated::class);
});

it('lets an admin suspend a verified seller', function () {
    Notification::fake();
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create(['verification_status' => VerificationStatus::Verified]);

    $this->actingAs($admin)
        ->postJson("/api/admin/sellers/{$seller->id}/suspend")
        ->assertOk()
        ->assertJsonPath('data.verification_status', 'suspended');
});

it('forbids a non-admin from verifying a seller', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->create(['verification_status' => VerificationStatus::Pending]);

    $this->actingAs($customer)
        ->postJson("/api/admin/sellers/{$seller->id}/verify")
        ->assertForbidden();
});

it('rejects an unauthenticated verification request', function () {
    $seller = Seller::factory()->create(['verification_status' => VerificationStatus::Pending]);

    $this->postJson("/api/admin/sellers/{$seller->id}/verify")->assertUnauthorized();
});

it('renders the verification queue with only pending sellers', function () {
    $admin = User::factory()->admin()->create();
    Seller::factory()->create(['verification_status' => VerificationStatus::Pending]);
    Seller::factory()->create(['verification_status' => VerificationStatus::Verified]);

    $this->actingAs($admin)->get('/admin/sellers/pending')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/VerificationQueue')->has('sellers', 1));
});

it('renders a seller detail page for admin', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->create();

    $this->actingAs($admin)->get("/admin/sellers/{$seller->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/SellerDetail')->where('seller.id', $seller->id));
});
