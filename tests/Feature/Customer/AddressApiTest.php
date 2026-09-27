<?php

use App\Models\Address;
use App\Models\User;

function actingCustomer(): User
{
    return User::factory()->customer()->create();
}

it('creates an address for the authenticated customer', function () {
    $user = actingCustomer();

    $this->actingAs($user)
        ->postJson('/api/addresses', [
            'line1' => '123 Main St',
            'city' => 'Springfield',
        ])
        ->assertCreated()
        ->assertJsonPath('data.line1', '123 Main St');

    expect(Address::where('user_id', $user->id)->count())->toBe(1);
});

it('stores latitude/longitude when provided from the map picker', function () {
    $user = actingCustomer();

    $this->actingAs($user)
        ->postJson('/api/addresses', [
            'line1' => '123 Main St',
            'city' => 'Springfield',
            'latitude' => 37.7749,
            'longitude' => -122.4194,
        ])
        ->assertCreated()
        ->assertJsonPath('data.latitude', 37.7749)
        ->assertJsonPath('data.longitude', -122.4194);

    $address = Address::where('user_id', $user->id)->first();
    expect($address->location->latitude)->toBe(37.7749);
    expect($address->location->longitude)->toBe(-122.4194);
});

it('rejects an address create request missing required fields', function () {
    $user = actingCustomer();

    $this->actingAs($user)
        ->postJson('/api/addresses', ['city' => 'Springfield'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('line1');
});

it('rejects an unauthenticated address create request', function () {
    $this->postJson('/api/addresses', ['line1' => '123 Main St', 'city' => 'Springfield'])
        ->assertUnauthorized();
});

it('rejects a seller attempting to use the customer address endpoint', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->postJson('/api/addresses', ['line1' => '123 Main St', 'city' => 'Springfield'])
        ->assertForbidden();
});

it('lets a customer update their own address', function () {
    $user = actingCustomer();
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson("/api/addresses/{$address->id}", ['line1' => 'New Line', 'city' => $address->city])
        ->assertOk()
        ->assertJsonPath('data.line1', 'New Line');
});

it('forbids a customer from updating another customer\'s address', function () {
    $owner = actingCustomer();
    $intruder = actingCustomer();
    $address = Address::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->putJson("/api/addresses/{$address->id}", ['line1' => 'Hijacked', 'city' => $address->city])
        ->assertForbidden();
});

it('returns not found for a nonexistent address', function () {
    $user = actingCustomer();

    $this->actingAs($user)
        ->putJson('/api/addresses/999999', ['line1' => 'Nowhere', 'city' => 'Nowhere'])
        ->assertNotFound();
});

it('lets a customer delete their own address', function () {
    $user = actingCustomer();
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->deleteJson("/api/addresses/{$address->id}")
        ->assertOk();

    expect(Address::find($address->id))->toBeNull();
});

it('forbids deleting another customer\'s address', function () {
    $owner = actingCustomer();
    $intruder = actingCustomer();
    $address = Address::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->deleteJson("/api/addresses/{$address->id}")
        ->assertForbidden();

    expect(Address::find($address->id))->not->toBeNull();
});
