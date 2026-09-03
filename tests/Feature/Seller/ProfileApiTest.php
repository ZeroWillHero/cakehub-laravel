<?php

use App\Models\Seller;
use App\Models\User;

it('lets a seller update their own store profile', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson('/api/seller/profile', [
            'business_name' => 'Updated Bakery',
            'whatsapp_number' => '+15559876543',
        ])
        ->assertOk()
        ->assertJsonPath('data.business_name', 'Updated Bakery');

    expect($seller->refresh()->business_name)->toBe('Updated Bakery');
});

it('lets a seller set their store location via latitude/longitude', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson('/api/seller/profile', [
            'business_name' => 'Pinned Bakery',
            'whatsapp_number' => '+15559876543',
            'latitude' => 37.7749,
            'longitude' => -122.4194,
        ])
        ->assertOk()
        ->assertJsonPath('data.latitude', 37.7749)
        ->assertJsonPath('data.longitude', -122.4194);
});

it('rejects a seller profile update missing required fields', function () {
    $user = User::factory()->seller()->create();
    Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson('/api/seller/profile', ['business_name' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['business_name', 'whatsapp_number']);
});

it('forbids a customer from hitting the seller profile endpoint', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->putJson('/api/seller/profile', [
            'business_name' => 'Nope',
            'whatsapp_number' => '+15559876543',
        ])
        ->assertForbidden();
});

it('rejects an unauthenticated seller profile update', function () {
    $this->putJson('/api/seller/profile', [
        'business_name' => 'Nope',
        'whatsapp_number' => '+15559876543',
    ])->assertUnauthorized();
});
