<?php

use App\Enums\UserRole;
use App\Models\User;

it('lets a new user become a customer and creates their profile', function () {
    $user = User::factory()->create(['role' => null]);

    $this->actingAs($user)
        ->post('/onboarding', ['role' => 'customer'])
        ->assertRedirect(route('home'));

    expect($user->refresh()->role)->toBe(UserRole::Customer);
    expect($user->customerProfile)->not->toBeNull();
});

it('lets a new user become a seller and creates their seller record', function () {
    $user = User::factory()->create(['role' => null]);

    $this->actingAs($user)
        ->post('/onboarding', [
            'role' => 'seller',
            'business_name' => 'Sweet Treats Bakery',
            'whatsapp_number' => '+15551234567',
        ])
        ->assertRedirect(route('seller.dashboard'));

    expect($user->refresh()->role)->toBe(UserRole::Seller);
    expect($user->seller)->not->toBeNull();
    expect($user->seller->business_name)->toBe('Sweet Treats Bakery');
});

it('rejects a seller role selection missing the required business fields', function () {
    $user = User::factory()->create(['role' => null]);

    $this->actingAs($user)
        ->post('/onboarding', ['role' => 'seller'])
        ->assertSessionHasErrors(['business_name', 'whatsapp_number']);

    expect($user->refresh()->role)->toBeNull();
});

it('rejects selecting the admin role via self-service onboarding', function () {
    $user = User::factory()->create(['role' => null]);

    $this->actingAs($user)
        ->post('/onboarding', ['role' => 'admin'])
        ->assertSessionHasErrors('role');

    expect($user->refresh()->role)->toBeNull();
});

it('forbids a user who already has a role from re-running onboarding', function () {
    $user = User::factory()->customer()->create();

    $this->actingAs($user)
        ->post('/onboarding', ['role' => 'seller'])
        ->assertForbidden();
});
