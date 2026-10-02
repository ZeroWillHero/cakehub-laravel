<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\User;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Moves a guest's session cart into their account cart when they sign in
 * (docs/plan-public-browsing-guest-cart.md §4.2). If the account already
 * holds a different seller's cart, nothing is replaced: the guest cart is
 * parked in the session and the customer picks which cart to keep on
 * /cart (D3), via POST /api/cart/merge.
 */
class CartMerger
{
    public const PENDING_KEY = 'cart_merge_pending';

    private GuestCart $guestCart;

    public function __construct(private Session $session)
    {
        $this->guestCart = new GuestCart($session);
    }

    /**
     * Runs right after a customer signs in (Google callback, or onboarding
     * when they pick the customer role) and decides where they land: the
     * page they were sent to sign in from (normally /checkout), or /cart
     * when the two carts conflict.
     */
    public function afterCustomerSignIn(User $user): RedirectResponse
    {
        [$lines, $dropped] = $this->validGuestLines();

        if ($dropped > 0) {
            Inertia::flash('notice', $dropped === 1
                ? '1 item in your cart is no longer available and was removed.'
                : "{$dropped} items in your cart are no longer available and were removed.");
        }

        if ($lines->isEmpty()) {
            $this->guestCart->clear();

            return $this->redirectToIntended();
        }

        $savedSellerId = $user->cartItems()->value('seller_id');

        if ($savedSellerId && $savedSellerId !== $lines->first()->seller_id) {
            $this->session->put(self::PENDING_KEY, true);

            return redirect()->route('cart');
        }

        $this->copyIntoAccount($user, $lines);
        $this->guestCart->clear();

        return $this->redirectToIntended();
    }

    /**
     * The page the customer was sent to sign in from (normally /checkout).
     * A seller/admin URL left over in the session would only 403 for a
     * customer, so those fall back to home.
     */
    private function redirectToIntended(): RedirectResponse
    {
        $path = parse_url((string) $this->session->get('url.intended'), PHP_URL_PATH) ?? '';

        if (preg_match('#^/(seller|admin)(/|$)#', $path)) {
            $this->session->forget('url.intended');
        }

        return redirect()->intended(route('home'));
    }

    /**
     * Sellers and admins can't place orders, so a cart built while signed
     * out is dropped, along with the checkout URL it was heading to.
     */
    public function discardForNonCustomer(): void
    {
        if (! $this->guestCart->isEmpty()) {
            Inertia::flash('notice', "Seller and admin accounts can't place orders, so your guest cart was cleared.");
        }

        $this->guestCart->clear();
        $this->session->forget([self::PENDING_KEY, 'url.intended']);
    }

    public function hasPendingConflict(): bool
    {
        return (bool) $this->session->get(self::PENDING_KEY, false);
    }

    /**
     * @return Collection<int, CartItem>
     */
    public function pendingGuestLines(): Collection
    {
        return $this->validGuestLines()[0];
    }

    /**
     * Resolves a pending conflict and returns the URL the customer was
     * originally heading to (normally /checkout), if any.
     *
     * @param  'saved'|'incoming'  $keep
     */
    public function resolve(User $user, string $keep): ?string
    {
        if ($keep === 'incoming') {
            [$lines] = $this->validGuestLines();

            if ($lines->isNotEmpty()) {
                $user->cartItems()->delete();
                $this->copyIntoAccount($user, $lines);
            }
        }

        $this->guestCart->clear();
        $this->session->forget(self::PENDING_KEY);

        return $this->session->pull('url.intended');
    }

    /**
     * Guest lines are re-checked at sign-in: the product may have been
     * deactivated, its seller unverified, or its option removed since the
     * guest added it.
     *
     * @return array{0: Collection<int, CartItem>, 1: int}
     */
    private function validGuestLines(): array
    {
        $total = count($this->guestCart->lines());

        $valid = $this->guestCart->hydrate()
            ->filter(fn (CartItem $item) => $item->product->is_active
                && $item->seller?->isPubliclyVisible()
                && ($item->product_variant_id === null || $item->variant !== null))
            ->values();

        return [$valid, $total - $valid->count()];
    }

    /**
     * @param  Collection<int, CartItem>  $lines
     */
    private function copyIntoAccount(User $user, Collection $lines): void
    {
        foreach ($lines as $line) {
            $user->cartItems()->create([
                'seller_id' => $line->seller_id,
                'product_id' => $line->product_id,
                'product_variant_id' => $line->product_variant_id,
                'quantity' => $line->quantity,
                'customization_notes' => $line->customization_notes,
            ]);
        }
    }
}
