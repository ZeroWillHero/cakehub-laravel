<?php

use App\Models\Review;
use App\Models\Seller;
use App\Models\User;

it('renders the seller reviews page', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Review::factory()->create(['seller_id' => $seller->id]);

    $this->actingAs($seller->user)->get('/seller/reviews')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Seller/Reviews')->has('reviews', 1));
});
