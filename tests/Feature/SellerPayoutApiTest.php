<?php

use App\Enums\SellerPayoutStatus;
use App\Models\Order;
use App\Models\Seller;
use App\Models\SellerPayout;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

it('lets an admin mark a payout as paid by uploading a slip', function () {
    $admin = User::factory()->admin()->create();
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create(['seller_id' => $seller->id]);
    $payout = SellerPayout::factory()->for($order)->for($seller)->create(['status' => SellerPayoutStatus::Pending]);

    $this->actingAs($admin)
        ->postJson("/api/admin/seller-payouts/{$payout->id}/mark-paid", ['slip' => UploadedFile::fake()->image('payout-slip.jpg')])
        ->assertOk()
        ->assertJsonPath('data.status', 'paid');

    $payout->refresh();
    expect($payout->status)->toBe(SellerPayoutStatus::Paid);
    expect($payout->slip_path)->not->toBeNull();
    Storage::disk('local')->assertExists($payout->slip_path);
});

it('lets the owning seller confirm receipt of a paid payout', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create(['seller_id' => $seller->id]);
    $payout = SellerPayout::factory()->for($order)->for($seller)->create(['status' => SellerPayoutStatus::Paid, 'paid_at' => now()]);

    $this->actingAs($seller->user)
        ->postJson("/api/seller/payouts/{$payout->id}/confirm")
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed');

    expect($payout->fresh()->confirmed_at)->not->toBeNull();
});

it('forbids a seller from confirming another seller\'s payout', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create(['seller_id' => $sellerA->id]);
    $payout = SellerPayout::factory()->for($order)->for($sellerA)->create(['status' => SellerPayoutStatus::Paid]);

    $this->actingAs($sellerB->user)
        ->postJson("/api/seller/payouts/{$payout->id}/confirm")
        ->assertForbidden();
});

it('rejects confirmation of a payout that has not been marked paid yet', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $order = Order::factory()->create(['seller_id' => $seller->id]);
    $payout = SellerPayout::factory()->for($order)->for($seller)->create(['status' => SellerPayoutStatus::Pending]);

    $this->actingAs($seller->user)
        ->postJson("/api/seller/payouts/{$payout->id}/confirm")
        ->assertStatus(422);

    expect($payout->fresh()->status)->toBe(SellerPayoutStatus::Pending);
});
