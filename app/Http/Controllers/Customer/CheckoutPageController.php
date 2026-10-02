<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Http\Resources\CartItemResource;
use App\Services\CartMerger;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        // Until the customer picks which cart to keep after signing in
        // (docs/plan-public-browsing-guest-cart.md D3), checkout would
        // silently use the saved cart — send them back to choose first.
        if ((new CartMerger(request()->session()))->hasPendingConflict()) {
            return redirect()->route('cart');
        }

        $user = request()->user();
        $items = $user->cartItems()->with(['product', 'variant', 'seller'])->get();

        return Inertia::render('Customer/Checkout', [
            'items' => CartItemResource::collection($items)->resolve(),
            'addresses' => AddressResource::collection($user->addresses)->resolve(),
        ]);
    }
}
