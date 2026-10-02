<?php

use App\Models\CartItem;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;
use App\Services\CartMerger;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

// docs/plan-public-browsing-guest-cart.md §4.2 — a guest cart is carried
// into the account at sign-in, and the customer resumes checkout.

function signInWithGoogleAs(User $user): void
{
    Socialite::shouldReceive('driver->user')->andReturn((new SocialiteUser())->map([
        'id' => $user->google_id,
        'name' => $user->name,
        'email' => $user->email,
        'avatar' => 'https://example.com/avatar.png',
    ]));
}

/**
 * @return array<string, mixed>
 */
function guestCheckoutSession(Product ...$products): array
{
    $items = [];
    foreach ($products as $i => $product) {
        $items[] = [
            'id' => $i + 1,
            'seller_id' => $product->seller_id,
            'product_id' => $product->id,
            'product_variant_id' => null,
            'quantity' => 2,
            'customization_notes' => 'Happy birthday',
        ];
    }

    return [
        'guest_cart' => ['next_id' => count($items) + 1, 'items' => $items],
        'url.intended' => url('/checkout'),
    ];
}

it('moves the guest cart into an empty account cart and resumes checkout', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    signInWithGoogleAs($customer);

    $this->withSession(guestCheckoutSession($product))
        ->get('/auth/google/callback')
        ->assertRedirect(url('/checkout'))
        ->assertSessionMissing('guest_cart');

    $item = $customer->cartItems()->sole();
    expect($item->product_id)->toBe($product->id)
        ->and($item->quantity)->toBe(2)
        ->and($item->customization_notes)->toBe('Happy birthday');
});

it('adds the guest cart to a saved cart from the same seller', function () {
    $customer = User::factory()->customer()->create();
    $seller = Seller::factory()->verified()->create();
    $saved = Product::factory()->for($seller)->create();
    $incoming = Product::factory()->for($seller)->create();
    CartItem::factory()->for($customer)->create(['seller_id' => $seller->id, 'product_id' => $saved->id]);
    signInWithGoogleAs($customer);

    $this->withSession(guestCheckoutSession($incoming))
        ->get('/auth/google/callback')
        ->assertRedirect(url('/checkout'));

    expect($customer->cartItems()->pluck('product_id')->sort()->values()->all())
        ->toBe(collect([$saved->id, $incoming->id])->sort()->values()->all());
});

it('asks which cart to keep when the saved cart is from a different seller', function () {
    $customer = User::factory()->customer()->create();
    $savedProduct = Product::factory()->for(Seller::factory()->verified())->create();
    $incomingProduct = Product::factory()->for(Seller::factory()->verified())->create();
    CartItem::factory()->for($customer)->create(['seller_id' => $savedProduct->seller_id, 'product_id' => $savedProduct->id]);
    signInWithGoogleAs($customer);

    $this->withSession(guestCheckoutSession($incomingProduct))
        ->get('/auth/google/callback')
        ->assertRedirect(route('cart'))
        ->assertSessionHas(CartMerger::PENDING_KEY, true);

    // Nothing is replaced until the customer chooses.
    expect($customer->cartItems()->pluck('product_id')->all())->toBe([$savedProduct->id]);

    $this->get('/cart')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Customer/Cart')
            ->where('pendingMerge.saved.0.product_id', $savedProduct->id)
            ->where('pendingMerge.incoming.0.product_id', $incomingProduct->id));
});

it('drops guest cart lines that are no longer available and says so', function () {
    $customer = User::factory()->customer()->create();
    $inactive = Product::factory()->for(Seller::factory()->verified())->create(['is_active' => false]);
    signInWithGoogleAs($customer);

    $this->withSession(guestCheckoutSession($inactive))
        ->get('/auth/google/callback')
        ->assertRedirect(url('/checkout'))
        ->assertSessionHas('inertia.flash_data.notice', '1 item in your cart is no longer available and was removed.')
        ->assertSessionMissing('guest_cart');

    expect($customer->cartItems()->count())->toBe(0);
});

it('drops guest cart lines from a seller who is no longer verified', function () {
    $customer = User::factory()->customer()->create();
    $product = Product::factory()->for(Seller::factory())->create();
    signInWithGoogleAs($customer);

    $this->withSession(guestCheckoutSession($product))->get('/auth/google/callback');

    expect($customer->cartItems()->count())->toBe(0);
});

it('still sends a customer without a guest cart or destination home', function () {
    $customer = User::factory()->customer()->create();
    signInWithGoogleAs($customer);

    $this->get('/auth/google/callback')->assertRedirect(route('home'));
});

it('clears a guest cart and ignores the checkout destination when a seller signs in', function () {
    $sellerUser = User::factory()->seller()->create();
    Seller::factory()->for($sellerUser)->create();
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    signInWithGoogleAs($sellerUser);

    $this->withSession(guestCheckoutSession($product))
        ->get('/auth/google/callback')
        ->assertRedirect(route('seller.dashboard'))
        ->assertSessionMissing('guest_cart')
        ->assertSessionMissing('url.intended')
        ->assertSessionHas('inertia.flash_data.notice');

    expect($sellerUser->cartItems()->count())->toBe(0);
});

it('clears a guest cart when an admin signs in', function () {
    $admin = User::factory()->admin()->create();
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    signInWithGoogleAs($admin);

    $this->withSession(guestCheckoutSession($product))
        ->get('/auth/google/callback')
        ->assertRedirect(route('admin.dashboard'))
        ->assertSessionMissing('guest_cart')
        ->assertSessionMissing('url.intended');
});

it('sends a customer home instead of to a leftover seller or admin page', function () {
    $customer = User::factory()->customer()->create();
    signInWithGoogleAs($customer);

    $this->withSession(['url.intended' => url('/seller/dashboard')])
        ->get('/auth/google/callback')
        ->assertRedirect(route('home'));
});

it('sends a customer back to choose a cart before checkout while a merge is pending', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->withSession([CartMerger::PENDING_KEY => true])
        ->get('/checkout')
        ->assertRedirect(route('cart'));
});

it('keeps the guest cart through onboarding and resumes checkout once a new user picks customer', function () {
    $newUser = User::factory()->create(['role' => null]);
    $product = Product::factory()->for(Seller::factory()->verified())->create();
    signInWithGoogleAs($newUser);

    $this->withSession(guestCheckoutSession($product))
        ->get('/auth/google/callback')
        ->assertRedirect(route('onboarding.show'))
        ->assertSessionHas('guest_cart');

    $this->post('/onboarding', ['role' => 'customer'])
        ->assertRedirect(url('/checkout'))
        ->assertSessionMissing('guest_cart');

    expect($newUser->cartItems()->sole()->product_id)->toBe($product->id);
});

it('discards the guest cart when a new user picks seller during onboarding', function () {
    $newUser = User::factory()->create(['role' => null]);
    $product = Product::factory()->for(Seller::factory()->verified())->create();

    $this->actingAs($newUser)
        ->withSession(guestCheckoutSession($product))
        ->post('/onboarding', ['role' => 'seller', 'business_name' => 'New Bakes', 'whatsapp_number' => '+94771234567'])
        ->assertRedirect(route('seller.dashboard'))
        ->assertSessionMissing('guest_cart')
        ->assertSessionMissing('url.intended');
});

describe('resolving a cart merge', function () {
    beforeEach(function () {
        config(['sanctum.stateful' => ['localhost']]);
        $this->withHeader('Referer', 'http://localhost');

        $this->customer = User::factory()->customer()->create();
        $this->savedProduct = Product::factory()->for(Seller::factory()->verified())->create();
        $this->incomingProduct = Product::factory()->for(Seller::factory()->verified())->create();
        CartItem::factory()->for($this->customer)->create([
            'seller_id' => $this->savedProduct->seller_id,
            'product_id' => $this->savedProduct->id,
        ]);
        $this->pendingSession = [
            ...guestCheckoutSession($this->incomingProduct),
            CartMerger::PENDING_KEY => true,
        ];
    });

    it('replaces the saved cart with the guest cart when the customer keeps the new one', function () {
        $this->actingAs($this->customer)
            ->withSession($this->pendingSession)
            ->postJson('/api/cart/merge', ['keep' => 'incoming'])
            ->assertOk()
            ->assertJsonPath('data.redirect_to', url('/checkout'))
            ->assertSessionMissing('guest_cart')
            ->assertSessionMissing(CartMerger::PENDING_KEY);

        expect($this->customer->cartItems()->pluck('product_id')->all())->toBe([$this->incomingProduct->id]);
    });

    it('keeps the saved cart and drops the guest cart when the customer keeps the saved one', function () {
        $this->actingAs($this->customer)
            ->withSession($this->pendingSession)
            ->postJson('/api/cart/merge', ['keep' => 'saved'])
            ->assertOk()
            ->assertJsonPath('data.redirect_to', url('/checkout'))
            ->assertSessionMissing('guest_cart');

        expect($this->customer->cartItems()->pluck('product_id')->all())->toBe([$this->savedProduct->id]);
    });

    it('returns a 409 when there is no merge waiting', function () {
        $this->actingAs($this->customer)
            ->postJson('/api/cart/merge', ['keep' => 'saved'])
            ->assertStatus(409);
    });

    it('rejects an unknown choice', function () {
        $this->actingAs($this->customer)
            ->withSession($this->pendingSession)
            ->postJson('/api/cart/merge', ['keep' => 'both'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['keep']);
    });

    it('rejects a guest', function () {
        $this->withSession($this->pendingSession)
            ->postJson('/api/cart/merge', ['keep' => 'saved'])
            ->assertUnauthorized();
    });
});
