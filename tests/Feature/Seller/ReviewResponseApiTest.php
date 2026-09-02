<?php

use App\Models\Review;
use App\Models\Seller;
use App\Models\User;

it('lets a seller respond to their own review', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $review = Review::factory()->create(['seller_id' => $seller->id]);

    $this->actingAs($seller->user)
        ->postJson("/api/seller/reviews/{$review->id}/response", ['response' => 'Thank you!'])
        ->assertOk()
        ->assertJsonPath('data.seller_response', 'Thank you!');
});

it('rejects a second response to the same review', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $review = Review::factory()->create(['seller_id' => $seller->id, 'seller_response' => 'Already responded']);

    $this->actingAs($seller->user)
        ->postJson("/api/seller/reviews/{$review->id}/response", ['response' => 'Again'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['response']);
});

it('forbids a seller from responding to another seller\'s review', function () {
    $sellerA = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $sellerB = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $review = Review::factory()->create(['seller_id' => $sellerA->id]);

    $this->actingAs($sellerB->user)
        ->postJson("/api/seller/reviews/{$review->id}/response", ['response' => 'Hi'])
        ->assertForbidden();
});

it('rejects an empty response', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $review = Review::factory()->create(['seller_id' => $seller->id]);

    $this->actingAs($seller->user)
        ->postJson("/api/seller/reviews/{$review->id}/response", ['response' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['response']);
});

it('rejects an unauthenticated response', function () {
    $review = Review::factory()->create();

    $this->postJson("/api/seller/reviews/{$review->id}/response", ['response' => 'Hi'])
        ->assertUnauthorized();
});
