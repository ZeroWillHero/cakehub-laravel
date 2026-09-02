<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartItemResource;
use Inertia\Inertia;
use Inertia\Response;

class CartPageController extends Controller
{
    public function index(): Response
    {
        $items = request()->user()->cartItems()->with(['product', 'variant', 'seller'])->get();

        return Inertia::render('Customer/Cart', [
            'items' => CartItemResource::collection($items)->resolve(),
        ]);
    }
}
