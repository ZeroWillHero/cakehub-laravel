<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductRequest;
use App\Http\Requests\Seller\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()->seller->products()
            ->with(['categories', 'variants', 'images'])
            ->latest()
            ->get();

        return ProductResource::collection($products)->response();
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;
        $data = $request->validated();

        $product = $seller->products()->create(collect($data)->except(['category_ids', 'variants'])->all());
        $product->categories()->sync($data['category_ids']);

        foreach ($data['variants'] ?? [] as $variant) {
            $product->variants()->create($variant);
        }

        return (new ProductResource($product->load(['categories', 'variants', 'images'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $data = $request->validated();
        $product->update(collect($data)->except(['category_ids', 'variants'])->all());
        $product->categories()->sync($data['category_ids']);

        $product->variants()->delete();
        foreach ($data['variants'] ?? [] as $variant) {
            $product->variants()->create($variant);
        }

        return (new ProductResource($product->load(['categories', 'variants', 'images'])))->response();
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $product->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
