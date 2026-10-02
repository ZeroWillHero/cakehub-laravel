<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartItemResource;
use App\Services\CartMerger;
use App\Services\GuestCart;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartPageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Signed-out visitors see their session cart
        // (docs/plan-public-browsing-guest-cart.md D2).
        if ($user === null) {
            return Inertia::render('Customer/Cart', [
                'items' => CartItemResource::collection((new GuestCart($request->session()))->hydrate())->resolve(),
                'pendingMerge' => null,
            ]);
        }

        $items = $user->cartItems()->with(['product', 'variant', 'seller'])->get();
        $cartMerger = new CartMerger($request->session());

        return Inertia::render('Customer/Cart', [
            'items' => CartItemResource::collection($items)->resolve(),
            // Set when the customer just signed in with a guest cart from a
            // different seller than their saved cart — the page asks which
            // one to keep (D3) before they can check out.
            'pendingMerge' => $cartMerger->hasPendingConflict() ? [
                'saved' => CartItemResource::collection($items)->resolve(),
                'incoming' => CartItemResource::collection($cartMerger->pendingGuestLines())->resolve(),
            ] : null,
        ]);
    }
}
