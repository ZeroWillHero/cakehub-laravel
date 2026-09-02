<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SellerResource;
use App\Models\Product;
use App\Models\Seller;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function show(Seller $seller): Response
    {
        return Inertia::render('Customer/Storefront', [
            'seller' => (new SellerResource($seller))->resolve(),
            'products' => ProductResource::collection(
                $seller->products()->active()->with(['categories', 'variants', 'images'])->get()
            )->resolve(),
        ]);
    }

    public function product(Seller $seller, Product $product): Response
    {
        abort_unless($product->seller_id === $seller->id, 404);

        return Inertia::render('Customer/ProductDetail', [
            'seller' => (new SellerResource($seller))->resolve(),
            'product' => (new ProductResource($product->load(['categories', 'variants', 'images'])))->resolve(),
        ]);
    }
}
