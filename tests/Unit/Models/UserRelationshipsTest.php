<?php

use App\Models\CustomerProfile;
use App\Models\Seller;
use App\Models\User;

it('links a customer user to their customer profile', function () {
    $user = User::factory()->customer()->create();
    $profile = CustomerProfile::factory()->for($user)->create();

    expect($user->customerProfile->id)->toBe($profile->id);
});

it('links a seller user to their seller record', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();

    expect($user->seller->id)->toBe($seller->id);
});

it('returns null seller for a user with no seller record', function () {
    $user = User::factory()->customer()->create();

    expect($user->seller)->toBeNull();
});
