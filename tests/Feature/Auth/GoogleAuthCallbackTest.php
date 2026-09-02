<?php

use App\Enums\UserRole;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

function fakeGoogleUser(string $id, string $email, string $name = 'Test User'): void
{
    $socialiteUser = (new SocialiteUser())->map([
        'id' => $id,
        'name' => $name,
        'email' => $email,
        'avatar' => 'https://example.com/avatar.png',
    ]);

    Socialite::shouldReceive('driver->user')->andReturn($socialiteUser);
}

it('auto-promotes an email on the admin allowlist to admin on first login', function () {
    config(['app.admin_emails' => ['admin@cakehub.test']]);
    fakeGoogleUser('google-admin-1', 'admin@cakehub.test');

    $this->get('/auth/google/callback')
        ->assertRedirect(route('admin.dashboard'));

    $user = User::query()->where('google_id', 'google-admin-1')->firstOrFail();
    expect($user->role)->toBe(UserRole::Admin);
});

it('does not promote an email that is not on the admin allowlist', function () {
    config(['app.admin_emails' => ['admin@cakehub.test']]);
    fakeGoogleUser('google-regular-1', 'someone-else@cakehub.test');

    $this->get('/auth/google/callback')
        ->assertRedirect(route('onboarding.show'));

    $user = User::query()->where('google_id', 'google-regular-1')->firstOrFail();
    expect($user->role)->toBeNull();
});

it('does not re-check the admin allowlist on a returning user', function () {
    config(['app.admin_emails' => ['formerly-admin@cakehub.test']]);
    $user = User::factory()->customer()->create([
        'google_id' => 'google-returning-1',
        'email' => 'formerly-admin@cakehub.test',
    ]);
    fakeGoogleUser('google-returning-1', 'formerly-admin@cakehub.test');

    $this->get('/auth/google/callback')
        ->assertRedirect(route('home'));

    expect($user->refresh()->role)->toBe(UserRole::Customer);
});
