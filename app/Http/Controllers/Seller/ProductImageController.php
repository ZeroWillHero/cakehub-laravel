<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function store(StoreProductImageRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $path = $request->file('image')->store("products/{$product->id}", 'public');

        $image = $product->images()->create([
            'path' => $path,
            'sort_order' => $product->images()->count(),
        ]);

        return (new ProductImageResource($image))->response()->setStatusCode(201);
    }

    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        $this->authorize('update', $product);

        abort_unless($image->product_id === $product->id, 404);

        Storage::disk('public')->delete($image->path);
        $image->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
