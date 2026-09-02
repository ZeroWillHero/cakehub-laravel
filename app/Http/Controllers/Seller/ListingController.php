<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ListingController extends Controller
{
    public function index(): Response
    {
        $seller = request()->user()->seller;

        return Inertia::render('Seller/Listings', [
            'products' => ProductResource::collection(
                $seller->products()->with(['categories', 'variants', 'images'])->latest()->get()
            )->resolve(),
            'usage' => $seller->listingUsage(),
            'limit' => $seller->listingLimit(),
        ]);
    }

    public function create(): Response
    {
        $seller = request()->user()->seller;

        return Inertia::render('Seller/ListingForm', [
            'categories' => CategoryResource::collection(
                Category::query()->where('is_active', true)->orderBy('sort_order')->get()
            )->resolve(),
            'usage' => $seller->listingUsage(),
            'limit' => $seller->listingLimit(),
            'product' => null,
        ]);
    }

    public function edit(Product $product): Response|RedirectResponse
    {
        $this->authorize('update', $product);

        return Inertia::render('Seller/ListingForm', [
            'categories' => CategoryResource::collection(
                Category::query()->where('is_active', true)->orderBy('sort_order')->get()
            )->resolve(),
            'usage' => $product->seller->listingUsage(),
            'limit' => $product->seller->listingLimit(),
            'product' => (new ProductResource($product->load(['categories', 'variants', 'images'])))->resolve(),
        ]);
    }
}
