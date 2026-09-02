<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Http\Resources\CartItemResource;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    public function show(): Response
    {
        $user = request()->user();
        $items = $user->cartItems()->with(['product', 'variant', 'seller'])->get();

        return Inertia::render('Customer/Checkout', [
            'items' => CartItemResource::collection($items)->resolve(),
            'addresses' => AddressResource::collection($user->addresses)->resolve(),
        ]);
    }
}
