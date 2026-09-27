<?php

use App\Enums\AdStatus;
use App\Models\Ad;
use App\Models\AdSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

// --- index (Inertia) ---

it('renders the admin ads page', function () {
    $admin = User::factory()->admin()->create();
    Ad::factory()->count(2)->create();

    $this->actingAs($admin)->get('/admin/ads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Ads')->has('ads', 2)->has('setting'));
});

// --- store ---

it('lets an admin create an ad', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/ads', [
            'name' => 'Summer Sale',
            'description' => 'Big discounts',
            'paid_amount' => 100,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Summer Sale')
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.created_by', $admin->id);

    $ad = Ad::query()->first();
    expect($ad)->not->toBeNull();
    expect($ad->status)->toBe(AdStatus::Draft);
    expect($ad->created_by)->toBe($admin->id);
});

it('assigns the next sort_order when creating an ad', function () {
    $admin = User::factory()->admin()->create();
    Ad::factory()->create(['sort_order' => 5]);

    $this->actingAs($admin)
        ->postJson('/api/admin/ads', [
            'name' => 'New Ad',
            'paid_amount' => 50,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDay()->toDateString(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.sort_order', 6);
});

it('forbids a non-admin (customer) from creating an ad', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/admin/ads', [
            'name' => 'Summer Sale',
            'paid_amount' => 100,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertForbidden();
});

it('forbids a non-admin (seller) from creating an ad', function () {
    $seller = User::factory()->seller()->create();

    $this->actingAs($seller)
        ->postJson('/api/admin/ads', [
            'name' => 'Summer Sale',
            'paid_amount' => 100,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertForbidden();
});

it('rejects an unauthenticated ad creation', function () {
    $this->postJson('/api/admin/ads', [
        'name' => 'Summer Sale',
        'paid_amount' => 100,
        'starts_at' => now()->toDateString(),
        'ends_at' => now()->addDays(5)->toDateString(),
    ])->assertUnauthorized();
});

it('rejects ad creation with a missing name', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/ads', [
            'paid_amount' => 100,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('rejects ad creation when ends_at is before starts_at', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/ads', [
            'name' => 'Bad Dates',
            'paid_amount' => 100,
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->subDay()->toDateString(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ends_at']);
});

it('rejects ad creation with an invalid status value', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/ads', [
            'name' => 'Bad Status',
            'paid_amount' => 100,
            'status' => 'not-a-real-status',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDay()->toDateString(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

// --- update ---

it('lets an admin update an ad', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create(['name' => 'Old name', 'status' => AdStatus::Draft]);

    $this->actingAs($admin)
        ->putJson("/api/admin/ads/{$ad->id}", ['name' => 'New name', 'status' => 'active'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New name')
        ->assertJsonPath('data.status', 'active');

    expect($ad->fresh()->status)->toBe(AdStatus::Active);
});

it('forbids a non-admin from updating an ad', function () {
    $customer = User::factory()->customer()->create();
    $ad = Ad::factory()->create();

    $this->actingAs($customer)
        ->putJson("/api/admin/ads/{$ad->id}", ['name' => 'Hacked'])
        ->assertForbidden();
});

it('rejects an unauthenticated ad update', function () {
    $ad = Ad::factory()->create();

    $this->putJson("/api/admin/ads/{$ad->id}", ['name' => 'Hacked'])->assertUnauthorized();
});

it('returns 404 when updating a non-existent ad', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/ads/999999', ['name' => 'Ghost'])
        ->assertNotFound();
});

it('rejects an ad update with an invalid status value', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create();

    $this->actingAs($admin)
        ->putJson("/api/admin/ads/{$ad->id}", ['status' => 'not-a-real-status'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

// --- uploadImage ---

it('uploads an image for an ad', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create();
    $file = UploadedFile::fake()->image('ad.jpg');

    $this->actingAs($admin)
        ->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $file])
        ->assertOk()
        ->assertJsonPath('data.id', $ad->id);

    $ad->refresh();
    expect($ad->image_path)->not->toBeNull();
});

it('deletes the old image file when a new one is uploaded', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create();
    $first = UploadedFile::fake()->image('first.jpg');
    $second = UploadedFile::fake()->image('second.jpg');

    $this->actingAs($admin)->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $first]);
    $oldPath = $ad->fresh()->image_path;

    $this->actingAs($admin)->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $second]);

    expect($oldPath)->not->toEqual($ad->fresh()->image_path);
    expect($ad->fresh()->image_path)->not->toBeNull();
});

it('forbids a non-admin from uploading an ad image', function () {
    $seller = User::factory()->seller()->create();
    $ad = Ad::factory()->create();
    $file = UploadedFile::fake()->image('ad.jpg');

    $this->actingAs($seller)
        ->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $file])
        ->assertForbidden();
});

it('rejects an unauthenticated ad image upload', function () {
    $ad = Ad::factory()->create();
    $file = UploadedFile::fake()->image('ad.jpg');

    $this->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $file])->assertUnauthorized();
});

it('rejects a non-image file for the ad image upload', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create();
    $file = UploadedFile::fake()->create('notes.txt', 10);

    $this->actingAs($admin)
        ->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $file])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image']);
});

it('rejects an oversized ad image upload', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create();
    $file = UploadedFile::fake()->create('huge.jpg', 20481)->size(20481);

    $this->actingAs($admin)
        ->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $file])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['image']);
});

// --- destroy ---

it('lets an admin delete an ad and removes its stored image file', function () {
    $admin = User::factory()->admin()->create();
    $ad = Ad::factory()->create();
    $file = UploadedFile::fake()->image('ad.jpg');
    $this->actingAs($admin)->postJson("/api/admin/ads/{$ad->id}/image", ['image' => $file]);

    $this->actingAs($admin)
        ->deleteJson("/api/admin/ads/{$ad->id}")
        ->assertOk();

    expect(Ad::query()->find($ad->id))->toBeNull();
});

it('forbids a non-admin from deleting an ad', function () {
    $customer = User::factory()->customer()->create();
    $ad = Ad::factory()->create();

    $this->actingAs($customer)
        ->deleteJson("/api/admin/ads/{$ad->id}")
        ->assertForbidden();

    expect(Ad::query()->find($ad->id))->not->toBeNull();
});

it('rejects an unauthenticated ad deletion', function () {
    $ad = Ad::factory()->create();

    $this->deleteJson("/api/admin/ads/{$ad->id}")->assertUnauthorized();
});

it('returns 404 when deleting a non-existent ad', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->deleteJson('/api/admin/ads/999999')
        ->assertNotFound();
});

// --- reorder ---

it('lets an admin reorder ads', function () {
    $admin = User::factory()->admin()->create();
    $a = Ad::factory()->create(['sort_order' => 0]);
    $b = Ad::factory()->create(['sort_order' => 1]);
    $c = Ad::factory()->create(['sort_order' => 2]);

    $this->actingAs($admin)
        ->patchJson('/api/admin/ads/reorder', ['order' => [$c->id, $a->id, $b->id]])
        ->assertOk();

    expect($c->fresh()->sort_order)->toBe(0);
    expect($a->fresh()->sort_order)->toBe(1);
    expect($b->fresh()->sort_order)->toBe(2);
});

it('forbids a non-admin from reordering ads', function () {
    $seller = User::factory()->seller()->create();
    $a = Ad::factory()->create(['sort_order' => 0]);
    $b = Ad::factory()->create(['sort_order' => 1]);

    $this->actingAs($seller)
        ->patchJson('/api/admin/ads/reorder', ['order' => [$b->id, $a->id]])
        ->assertForbidden();
});

it('rejects an unauthenticated ad reorder', function () {
    $this->patchJson('/api/admin/ads/reorder', ['order' => []])->assertUnauthorized();
});

it('rejects a reorder payload containing a non-existent ad id', function () {
    $admin = User::factory()->admin()->create();
    $a = Ad::factory()->create();

    $this->actingAs($admin)
        ->patchJson('/api/admin/ads/reorder', ['order' => [$a->id, 999999]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order.1']);
});

// --- updateSetting ---

it('lets an admin update the ad rotation setting', function () {
    $admin = User::factory()->admin()->create();
    AdSetting::current();

    $this->actingAs($admin)
        ->putJson('/api/admin/ads/setting', ['rotation_seconds' => 10])
        ->assertOk()
        ->assertJsonPath('data.rotation_seconds', 10);

    expect(AdSetting::current()->rotation_seconds)->toBe(10);
});

it('forbids a non-admin from updating the ad rotation setting', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->putJson('/api/admin/ads/setting', ['rotation_seconds' => 10])
        ->assertForbidden();
});

it('rejects an unauthenticated ad rotation setting update', function () {
    $this->putJson('/api/admin/ads/setting', ['rotation_seconds' => 10])->assertUnauthorized();
});

it('rejects a rotation_seconds value below the minimum boundary', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/ads/setting', ['rotation_seconds' => 0])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rotation_seconds']);
});

it('rejects a rotation_seconds value above the maximum boundary', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/ads/setting', ['rotation_seconds' => 61])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rotation_seconds']);
});

it('accepts rotation_seconds at the minimum boundary', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/ads/setting', ['rotation_seconds' => 1])
        ->assertOk()
        ->assertJsonPath('data.rotation_seconds', 1);
});

it('accepts rotation_seconds at the maximum boundary', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/ads/setting', ['rotation_seconds' => 60])
        ->assertOk()
        ->assertJsonPath('data.rotation_seconds', 60);
});
