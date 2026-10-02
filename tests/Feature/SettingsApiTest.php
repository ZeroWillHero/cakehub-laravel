<?php

use App\Enums\UserStatus;
use App\Models\Seller;
use App\Models\User;

it('lets an authenticated user update their notification preferences', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->putJson('/api/settings/notifications', [
            'order_status_email' => false,
            'seller_verification_email' => true,
            'subscription_status_email' => false,
        ])
        ->assertOk()
        ->assertJsonPath('data.updated', true);

    $user->refresh();
    expect($user->notification_preferences)->toBe([
        'order_status' => ['email' => false],
        'seller_verification' => ['email' => true],
        'subscription_status' => ['email' => false],
    ]);
});

it('rejects a notification preferences update missing required fields', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->putJson('/api/settings/notifications', ['order_status_email' => false])
        ->assertStatus(422);
});

it('rejects an unauthenticated notification preferences update', function () {
    $this->putJson('/api/settings/notifications', [
        'order_status_email' => true,
        'seller_verification_email' => true,
        'subscription_status_email' => true,
    ])->assertStatus(401);
});

it('lets a user deactivate their own account and logs them out', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->postJson('/api/settings/deactivate')
        ->assertOk()
        ->assertJsonPath('data.deactivated', true);

    expect($user->refresh()->status)->toBe(UserStatus::Deactivated);
});

it('rejects an unauthenticated deactivate request', function () {
    $this->postJson('/api/settings/deactivate')->assertStatus(401);
});

it('blocks a deactivated account from subsequent authenticated requests', function () {
    $user = User::factory()->customer()->create(['status' => UserStatus::Deactivated]);

    $this->actingAs($user)
        ->getJson('/api/notifications')
        ->assertStatus(403);
});

it('lets a seller update their payout details', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson('/api/seller/settings/payout', [
            'payout_bank_name' => 'Test Bank',
            'payout_account_name' => 'Test Bakery',
            'payout_account_number' => '1234567890',
        ])
        ->assertOk()
        ->assertJsonPath('data.payout_bank_name', 'Test Bank');

    expect($seller->refresh()->payout_bank_name)->toBe('Test Bank');
});

it('never exposes payout details to a non-owning viewer', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->verified()->for($user)->create([
        'payout_bank_name' => 'Secret Bank',
    ]);
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->getJson("/api/sellers/{$seller->slug}/products")
        ->assertOk();

    // The payout fields must never leak via the public sellers/search endpoints.
    $response = $this->getJson('/api/sellers/search?q=' . urlencode($seller->business_name));
    $response->assertOk();
    expect($response->json('data.0'))->not->toHaveKey('payout_bank_name');
});

it('forbids a customer from updating seller payout details', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->putJson('/api/seller/settings/payout', ['payout_bank_name' => 'Test Bank'])
        ->assertStatus(403);
});

it('rejects an unauthenticated payout update', function () {
    $this->putJson('/api/seller/settings/payout', ['payout_bank_name' => 'Test Bank'])
        ->assertStatus(401);
});
