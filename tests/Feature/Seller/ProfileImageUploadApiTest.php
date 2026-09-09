<?php

use App\Models\Seller;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

it('lets a seller upload a logo', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();
    $file = UploadedFile::fake()->image('logo.jpg');

    $this->actingAs($user)
        ->postJson('/api/seller/profile/logo', ['image' => $file])
        ->assertOk()
        ->assertJsonPath('data.id', $seller->id);

    $seller->refresh();
    expect($seller->logo_path)->not->toBeNull();
});

it('lets a seller upload a cover photo', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();
    $file = UploadedFile::fake()->image('cover.jpg');

    $this->actingAs($user)
        ->postJson('/api/seller/profile/cover', ['image' => $file])
        ->assertOk();

    $seller->refresh();
    expect($seller->cover_path)->not->toBeNull();
});

it('deletes the old logo when a new one is uploaded', function () {
    $user = User::factory()->seller()->create();
    $seller = Seller::factory()->for($user)->create();

    $this->actingAs($user)->postJson('/api/seller/profile/logo', ['image' => UploadedFile::fake()->image('a.jpg')])->assertOk();
    $oldPath = $seller->refresh()->logo_path;

    $this->actingAs($user)->postJson('/api/seller/profile/logo', ['image' => UploadedFile::fake()->image('b.jpg')])->assertOk();

});

it('rejects a non-image file for the logo upload', function () {
    $user = User::factory()->seller()->create();
    Seller::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson('/api/seller/profile/logo', ['image' => UploadedFile::fake()->create('notes.txt', 10)])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image']);
});

it('forbids a customer from uploading a seller logo', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/seller/profile/logo', ['image' => UploadedFile::fake()->image('logo.jpg')])
        ->assertForbidden();
});

it('rejects an unauthenticated logo upload', function () {
    $this->postJson('/api/seller/profile/logo', ['image' => UploadedFile::fake()->image('logo.jpg')])
        ->assertUnauthorized();
});
