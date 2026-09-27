<?php

namespace App\Http\Controllers\Seller;

use App\Helpers\CloudinaryHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;

class ProductImageController extends Controller
{
    public function store(StoreProductImageRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $uploadResponse = CloudinaryHelper::upload(
            $request->file('image'),
            'products/' . $product->seller_id,
        );

        $image = $product->images()->create([
            'path' => $uploadResponse['public_id'],
            'sort_order' => $product->images()->count(),
        ]);

        return (new ProductImageResource($image))->response()->setStatusCode(201);
    }

    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        $this->authorize('update', $product);

        abort_unless($image->product_id === $product->id, 404);

        CloudinaryHelper::delete($image->path);
        $image->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
